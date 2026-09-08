define([
	'ash',
	'text/Text',
	'utils/MapUtils',
	'utils/UIList',
	'utils/UIState',
	'core/ExceptionHandler',
	'game/GameGlobals',
	'game/GlobalSignals',
	'game/constants/DialogueConstants',
	'game/constants/ExplorationConstants',
	'game/constants/PlayerStatConstants',
	'game/constants/TextConstants',
	'game/constants/LogConstants',
	'game/constants/UIConstants',
	'game/constants/PositionConstants',
	'game/constants/LocaleConstants',
	'game/constants/LevelConstants',
	'game/constants/MovementConstants',
	'game/constants/StoryConstants',
	'game/constants/TradeConstants',
	'game/constants/TribeConstants',
	'game/constants/WorldConstants',
	'game/nodes/PlayerPositionNode',
	'game/nodes/PlayerLocationNode',
	'game/nodes/NearestCampNode',
	'game/components/player/VisionComponent',
	'game/components/player/StaminaComponent',
	'game/components/sector/PassagesComponent',
	'game/components/sector/SectorControlComponent',
	'game/components/sector/SectorFeaturesComponent',
	'game/components/sector/SectorLocalesComponent',
	'game/components/sector/MovementOptionsComponent',
	'game/components/common/PositionComponent',
	'game/components/common/CampComponent',
	'game/components/type/LevelComponent',
	'game/components/sector/improvements/SectorImprovementsComponent',
	'game/components/sector/improvements/WorkshopComponent',
	'game/components/sector/SectorStatusComponent',
	'game/components/sector/EnemiesComponent'
], function (
	Ash,
	Text, MapUtils, UIList, UIState, ExceptionHandler, GameGlobals, GlobalSignals, DialogueConstants, ExplorationConstants, PlayerStatConstants, TextConstants,
	LogConstants, UIConstants, PositionConstants, LocaleConstants, LevelConstants, MovementConstants, StoryConstants, TradeConstants,
	TribeConstants, WorldConstants, PlayerPositionNode, PlayerLocationNode, NearestCampNode, VisionComponent, StaminaComponent,
	PassagesComponent, SectorControlComponent, SectorFeaturesComponent, SectorLocalesComponent,
	MovementOptionsComponent, PositionComponent, CampComponent, LevelComponent, SectorImprovementsComponent,
	WorkshopComponent, SectorStatusComponent, EnemiesComponent
) {
	var UIOutLevelSystem = Ash.System.extend({

		engine: null,

		playerPosNodes: null,
		playerLocationNodes: null,
		nearestCampNodes: null,

		pendingUpdateMap: true,

		constructor: function () {
			GameGlobals.uiFunctions.toggle("#switch-out .bubble", false);

			this.elements = {};
			this.elements.sectorHeader = $("#header-sector");
			this.elements.description = $("#out-desc");
			this.elements.btnScavengeHeap = $("#out-action-scavenge-heap");
			this.elements.btnClearWorkshop = $("#out-action-clear-workshop");
			this.elements.btnNap = $("#out-action-nap");
			this.elements.btnWait = $("#out-action-wait");
			this.elements.outImprovementsTR = $("#out-improvements tr");
			
			this.initElements();

			return this;
		},

		addToEngine: function (engine) {
			this.playerPosNodes = engine.getNodeList(PlayerPositionNode);
			this.playerLocationNodes = engine.getNodeList(PlayerLocationNode);
			this.nearestCampNodes = engine.getNodeList(NearestCampNode);

			this.initListeners();

			this.engine = engine;
		},

		removeFromEngine: function (engine) {
			this.playerPosNodes = null;
			this.playerLocationNodes = null;
			this.engine = null;
		},
		
		initElements: function () {
			this.localeList = UIList.create(this, $("#table-out-actions-locales"), this.createLocaleListItem, this.updateLocaleListItem, this.isLocaleListItemDataSame);

			let makeMovementActionsTD = function (direction) {
				let normalID = "out-action-move-" + direction;
				let gritID = "out-action-move-" + direction + "-grit";
				let normalAction = "move_sector_" + direction;
				let gritAction = "move_sector_grit_" + direction;
				let textKey = "ui.map.direction_" + direction + "_name_short";

				let result = "";
				result += "<td>";
				result += "<button class='action btn-icon action-move text-key movement-action-normal' id='" + normalID + "' action='" + normalAction + "' data-text-key='" + textKey + "'></button>";
				result += "<button class='action btn-icon action-move text-key movement-action-grit btn-warning' id='" + gritID + "' action='" + gritAction + "' data-text-key='" + textKey + "'></button>";
				result += "</td>";
				return result;
			};

			let $movementActionsTable = $("#table-out-actions-movement");
			$movementActionsTable.append("<tr>");
			$movementActionsTable.append(makeMovementActionsTD("nw"));
			$movementActionsTable.append(makeMovementActionsTD("north"));
			$movementActionsTable.append(makeMovementActionsTD("ne"));
			$movementActionsTable.append("</tr>");
			$movementActionsTable.append("<tr>");
			$movementActionsTable.append(makeMovementActionsTD("west"));
			$movementActionsTable.append("<td></td>");
			$movementActionsTable.append(makeMovementActionsTD("east"));
			$movementActionsTable.append("</tr>");
			$movementActionsTable.append("<tr>");
			$movementActionsTable.append(makeMovementActionsTD("sw"));
			$movementActionsTable.append(makeMovementActionsTD("south"));
			$movementActionsTable.append(makeMovementActionsTD("se"));
			$movementActionsTable.append("</tr>");
		},

		initListeners: function () {
			var sys = this;
			GlobalSignals.playerPositionChangedSignal.add(function () {
				if (GameGlobals.gameState.uiStatus.isHidden) return;
				sys.updateAll();
			});
			GlobalSignals.improvementBuiltSignal.add(function () {
				sys.updateAll();
			});
			GlobalSignals.inventoryChangedSignal.add(function () {
				sys.updateSectorDescription();
				sys.updateOutImprovementsList();
				sys.updateMovementActions();
				sys.updateDespair();
			});
			GlobalSignals.featureUnlockedSignal.add(function () {
				sys.updateUnlockedFeatures();
			});
			GlobalSignals.fightEndedSignal.add(function () {
				sys.updateSectorDescription();
				sys.updateMovementRelatedActions();
			});
			GlobalSignals.sectorScoutedSignal.add(function () {
				sys.updateAll();
			});
			GlobalSignals.actionCompletedSignal.add(function () {
				sys.updateSectorDescription();
				sys.updateMovementActions();
			});
			GlobalSignals.visionChangedSignal.add(function () {
				sys.updateAll();
			});
			GlobalSignals.gameShownSignal.add(function () {
				sys.updateAll();
			});
			GlobalSignals.add(this, GlobalSignals.playerLeftCampSignal, this.updateAll);
			GlobalSignals.add(this, GlobalSignals.collectorCollectedSignal, this.updateOutImprovementsStatus);
			GlobalSignals.add(this, GlobalSignals.movementBlockerClearedSignal, this.updateAll);
			GlobalSignals.add(this, GlobalSignals.slowUpdateSignal, this.slowUpdate);
			GlobalSignals.add(this, GlobalSignals.popupClosedSignal, this.onPopupClosed);
			GlobalSignals.add(this, GlobalSignals.buttonStateChangedSignal, this.onButtonStateChanged);
			GlobalSignals.add(this, GlobalSignals.localeScoutedSignal, this.scheduleMapUpdate);
			GlobalSignals.add(this, GlobalSignals.inventoryChangedSignal, this.scheduleMapUpdate);
			GlobalSignals.add(this, GlobalSignals.equipmentChangedSignal, this.scheduleMapUpdate);
			GlobalSignals.add(this, GlobalSignals.sectorRevealedSignal, this.scheduleMapUpdate);
			GlobalSignals.add(this, GlobalSignals.themeToggledSignal, this.scheduleMapUpdate);
			this.rebuildVis();
			this.updateUnlockedFeatures();
		},

		update: function (time) {
			if (GameGlobals.gameState.isPaused) return;
			if (GameGlobals.gameState.uiStatus.currentTab !== GameGlobals.uiFunctions.elementIDs.tabs.out) return;

			var posComponent = this.playerPosNodes.head.position;

			if (!this.playerLocationNodes.head) return;

			if (!posComponent.inCamp) {
				if (this.pendingUpdateMap)
					this.rebuildVis();
			}
		},
		
		slowUpdate: function () {
			if (!this.playerLocationNodes.head) return;
			this.updateOutImprovementsStatus();
			this.updateLevelPageActionsSlow();
		},

		updateAll: function () {
			if (GameGlobals.gameState.uiStatus.isHidden) return;
			if (!this.playerLocationNodes.head) return;

			this.rebuildVis();
			this.updateLocales();
			this.updateMovementRelatedActions();
			this.updateLocationDetails();
			this.updateSectorDescription();
			this.updateLevelPageActions();
			this.updateLevelPageActionsSlow();
			this.updateUnlockedFeatures();
			this.updateOutImprovementsList();
			this.updateOutImprovementsStatus();
			this.updateMovementActions();
			this.updateCharacters();
			this.updateDespair();
		},
		
		scheduleMapUpdate: function () {
			this.pendingUpdateMap = true;
		},

		updateUnlockedFeatures: function () {
			GameGlobals.uiFunctions.toggle("#out-container-compass", GameGlobals.gameState.unlockedFeatures.scout);
			GameGlobals.uiFunctions.toggle("#out-container-compass-actions", GameGlobals.gameState.unlockedFeatures.scout);
			GameGlobals.uiFunctions.toggle("#minimap-background-container", GameGlobals.gameState.unlockedFeatures.scout);
			GameGlobals.uiFunctions.toggle("#minimap", GameGlobals.gameState.unlockedFeatures.scout);
		},

		updateLevelPageActionsSlow: function () {
			if (GameGlobals.gameState.uiStatus.isHidden) return;
			var sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);

			var hasCampHere = this.playerLocationNodes.head.entity.has(CampComponent);
			var isScouted = sectorStatus.scouted;

			this.updateNap(isScouted, hasCampHere);
			this.updateWait(hasCampHere);
			this.updateDespair();
		},

		updateLevelPageActions: function (isScouted, hasCamp, hasCampHere) {
			if (GameGlobals.gameState.uiStatus.isHidden) return;
			
			var sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);
			var hasCamp = GameGlobals.levelHelper.getLevelEntityForSector(this.playerLocationNodes.head.entity).has(CampComponent);
			var hasCampHere = this.playerLocationNodes.head.entity.has(CampComponent);
			var isScouted = sectorStatus.scouted;
			let isAwake = this.playerPosNodes.head.entity.get(VisionComponent).isAwake;
			
			var sectorControlComponent = this.playerLocationNodes.head.entity.get(SectorControlComponent);
			var featuresComponent = this.playerLocationNodes.head.entity.get(SectorFeaturesComponent);
			var workshopComponent = this.playerLocationNodes.head.entity.get(WorkshopComponent);
			var improvements = this.playerLocationNodes.head.entity.get(SectorImprovementsComponent);
			var passagesComponent = this.playerLocationNodes.head.entity.get(PassagesComponent);

			var passageUpBuilt = improvements.getCount(improvementNames.passageUpStairs) +
				improvements.getCount(improvementNames.passageUpElevator) +
				improvements.getCount(improvementNames.passageUpHole) > 0;
			var passageDownBuilt = improvements.getCount(improvementNames.passageDownStairs) +
				improvements.getCount(improvementNames.passageDownElevator) +
				improvements.getCount(improvementNames.passageDownHole) > 0;

			GameGlobals.uiFunctions.toggle("#out-action-move-up", (isScouted && passagesComponent.passageUp != null) || passageUpBuilt);
			GameGlobals.uiFunctions.toggle("#out-action-move-down", (isScouted && passagesComponent.passageDown != null) || passageDownBuilt);
			GameGlobals.uiFunctions.toggle("#out-action-move-camp", hasCamp && !hasCampHere);
			GameGlobals.uiFunctions.toggle("#out-action-move-camp-details", hasCamp && !hasCampHere);

			GameGlobals.uiFunctions.toggle("#out-action-get-up", !isAwake);
			GameGlobals.uiFunctions.toggle("#out-action-enter", isAwake && hasCampHere);
			GameGlobals.uiFunctions.toggle("#out-action-sca", isAwake);
			GameGlobals.uiFunctions.toggle("#out-action-scout", isAwake && GameGlobals.gameState.unlockedFeatures.vision);
			GameGlobals.uiFunctions.toggle("#out-action-use-spring", isAwake && isScouted && featuresComponent.hasSpring);
			GameGlobals.uiFunctions.toggle("#out-action-investigate", isAwake && this.showInvestigate());

			// examine spots
			let showExamine = featuresComponent.examineSpots.length > 0 && isScouted;
			GameGlobals.uiFunctions.toggle("#out-action-examine", showExamine);
			if (showExamine) {
				let spotID = featuresComponent.examineSpots[0];
				let spotDef = StoryConstants.getSectorExampineSpot(spotID);
				$("#out-action-examine").find(".btn-label").text("khám xét " + Text.t(spotDef.shortNameKey));
			}

			// workshop
			let showWorkshop = isScouted && workshopComponent != null && workshopComponent.isClearable && !sectorControlComponent.hasControlOfLocale(LocaleConstants.LOCALE_ID_WORKSHOP)
			GameGlobals.uiFunctions.toggle(this.elements.btnClearWorkshop, showWorkshop);
			if (showWorkshop) {
				let workshopName = TextConstants.getWorkshopName(workshopComponent.resource);
				this.elements.btnClearWorkshop.find(".btn-label").text("thám sát " + workshopName);
			}

			// resource heap
			let showHeap = isScouted && featuresComponent.heapResource != null;
			GameGlobals.uiFunctions.toggle(this.elements.btnScavengeHeap, showHeap);
			if (showHeap) {
				let heapName = TextConstants.getHeapDisplayName(featuresComponent.heapResource, featuresComponent);
				this.elements.btnScavengeHeap.find(".btn-label").text("lục lọi " + heapName);
			}

			GameGlobals.uiFunctions.slideToggleIf("#out-locales", null, this.getVisibleLocales().length > 0, 200, 0);
			GameGlobals.uiFunctions.slideToggleIf("#container-out-actions-movement-related", null, isScouted, 200, 0);

			GameGlobals.uiFunctions.toggle("#table-out-actions-movement", GameGlobals.gameState.isFeatureUnlocked("move"));
			GameGlobals.uiFunctions.toggle("#container-tab-two-out-actions h3", GameGlobals.gameState.isFeatureUnlocked("move"));
			GameGlobals.uiFunctions.toggle("#out-improvements", GameGlobals.gameState.unlockedFeatures.vision);
			GameGlobals.uiFunctions.toggle("#out-improvements table", GameGlobals.gameState.unlockedFeatures.vision);
		},

		getVisibleLocales: function () {
			let sectorLocalesComponent = this.playerLocationNodes.head.entity.get(SectorLocalesComponent);
			let result = [];
			for (let i = 0; i < sectorLocalesComponent.locales.length; i++) {
				let localeVO = sectorLocalesComponent.locales[i];
				if (!this.isLocaleVisible(localeVO)) continue;;
				localeVO.index = i;
				result.push(localeVO);
			}

			return result;
		},

		isLocaleVisible: function (locale) {
			if (!locale) return false;
			return GameGlobals.sectorHelper.isLocaleVisible(this.playerLocationNodes.head.entity, locale);
		},

		updateNap: function (isScouted, hasCampHere) {
			if (hasCampHere) {
				GameGlobals.uiFunctions.toggle(this.elements.btnNap, false);
				return;
			}
			
			var staminaComponent = this.playerPosNodes.head.entity.get(StaminaComponent);
			var hasFirstCamp = GameGlobals.gameState.numCamps > 0;

			var costToCamp = GameGlobals.playerActionsHelper.getCosts("move_camp_level");
			var staminaToCamp = costToCamp.stamina || 10;
			var staminaCostToMove = staminaToCamp;
			var missingStamina = staminaCostToMove - staminaComponent.stamina;
			var lowStamina = missingStamina > 0 || staminaComponent.stamina <= PlayerStatConstants.STAMINA_GAINED_FROM_NAP;

			let blockedByTutorial = !hasFirstCamp && staminaComponent.stamina > 15;
			GameGlobals.uiFunctions.toggle(this.elements.btnNap, lowStamina && !blockedByTutorial);
		},
		
		updateWait: function (hasCampHere) {
			let hasFirstCamp = GameGlobals.gameState.numCamps > 0;
			let showWait = false;
			
			if (!hasCampHere && hasFirstCamp) {
				let maxResourcesToShowWait = 3;
				let resources = [ "food", "water" ];
				for (let i = 0; i < resources.length; i++) {
					let name = resources[i];
					if (!GameGlobals.gameState.unlockedFeatures["resource_" + name]) continue;
					if (!GameGlobals.playerHelper.hasCollectibleResource(name, false)) continue;
					let total = Math.floor(GameGlobals.playerHelper.getResourceInInventory(name)) + Math.floor(this.getResourceCurrentlyAvailableToCollect(name));
					if (total < maxResourcesToShowWait) showWait = true;
				}
			}
			
			GameGlobals.uiFunctions.toggle(this.elements.btnWait, showWait);
		},

		updateDespair: function () {
			if (GameGlobals.gameState.uiStatus.isHidden) return;

			let activeDespairType = GameGlobals.playerHelper.getActiveDespairType();
			let delay = 1250;
			
			let canMove = GameGlobals.playerHelper.canMove();
			let showCantMove = !canMove && activeDespairType;

			UIState.refreshStateDelayedFeedback(this, "cant-move", showCantMove, showCantMove ? delay : 0, () => {
				if (showCantMove) {
					let msg = LogConstants.getCantMoveMessage(activeDespairType);
					GameGlobals.playerHelper.addLogMessage(LogConstants.MSD_ID_MOVE_UNAVAILABLE, msg);
				}
			});
			
			let showDespairButton = activeDespairType != null;

			UIState.refreshStateDelayedFeedback(this, "despair-button", showDespairButton, showDespairButton ? delay : 0, () => {
				GameGlobals.uiFunctions.toggle("#out-action-despair", showDespairButton);
				if (showDespairButton) {
					log.i("show despair button:" + activeDespairType);
					let logDespair = activeDespairType == MovementConstants.DESPAIR_TYPE_STAMINA || activeDespairType == MovementConstants.DESPAIR_TYPE_MOVEMENT;
					if (logDespair) {
						let msg = LogConstants.getDespairMessage(activeDespairType);
						GameGlobals.playerHelper.addLogMessage(LogConstants.MSG_ID_DESPAIR_AVAILABLE, msg);
					}
				}
			});
		},

		showTollGatePopup: function (direction) {
			let action = "clear_gate_" + direction;
			let title = "Trạm thu phí";
			let msg = "Một nhóm du côn đang tụ tập. Chúng muốn bạn trả phí để đi qua.";
			GameGlobals.uiFunctions.showActionPopup(action, title, msg);
		},

		getDescription: function (entity, hasCampHere, hasCampOnLevel, hasVision, isScouted) {
			var position = entity.get(PositionComponent).getPosition();
			var passagesComponent = this.playerLocationNodes.head.entity.get(PassagesComponent);
			var workshopComponent = this.playerLocationNodes.head.entity.get(WorkshopComponent);
			var featuresComponent = this.playerLocationNodes.head.entity.get(SectorFeaturesComponent);
			var sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);
			var enemiesComponent = this.playerLocationNodes.head.entity.get(EnemiesComponent);
			var localesComponent = entity.get(SectorLocalesComponent);
			var hasEnemies = enemiesComponent.hasEnemies;

			var description = "<p>";
			description += this.getTextureDescription(hasVision, entity, position, featuresComponent, sectorStatus, localesComponent);
			description += this.getFunctionalDescription(hasVision, isScouted, featuresComponent, workshopComponent, hasCampHere, hasCampOnLevel);
			description += "</p><p>";
			description += this.getStatusDescription(hasVision, isScouted, hasEnemies, featuresComponent, passagesComponent, hasCampHere, hasCampOnLevel);
			description += this.getMovementDescription(isScouted, passagesComponent, entity);
			description += "</p><p>";
			
			if (isScouted) {
				if (sectorStatus.graffiti) {
					description += "Có hình vẽ trên tường ở đây: " + sectorStatus.graffiti;
					description += "</p><p>";
				} else if (featuresComponent.graffiti) {
					description += "Có hình vẽ trên tường ở đây: " + Text.t(featuresComponent.graffiti);
					description += "</p><p>";
				}
			}
			
			description += this.getResourcesDescription(isScouted, featuresComponent, sectorStatus);
			description += "</p>";
			return description;
		},

		getTextureDescription: function (hasVision, sector, position, featuresComponent, sectorStatus, localesComponent) {
			let campOrdinal = GameGlobals.worldState.getCampOrdinal(position.level);
			let hasGlowStickLight = sectorStatus.glowStickSeconds > 0;
			let hasLight = hasVision || featuresComponent.sunlit || hasGlowStickLight;
			
			// sector static description
			var features = GameGlobals.sectorHelper.getTextFeatures(sector);
			var desc = TextConstants.getSectorDescription(hasVision, features) + ". ";

			// light / darkness description
			if (featuresComponent.sunlit >= 1) {
				if (hasVision) desc += "Khu vực ngập trong <span class='hl-functionality'>ánh sáng ban ngày</span> gay gắt. ";
				else desc += "Khu vực ngập trong <span class='hl-functionality'>ánh nắng</span> chói lòa. ";
			} else if (featuresComponent.sunlit > 0) {
				desc += "Khu vực được chiếu sáng bởi <span class='hl-functionality'>ánh nắng gián tiếp</span> từ khu vực lân cận. ";
			} else {
				if (sectorStatus.glowStickSeconds > -5) {
					if (sectorStatus.glowStickSeconds < 5)
						desc += "Que phát sáng dần tắt.";
					else
						desc += "Một que phát sáng tỏa ra <span class='hl-functionality'>ánh sáng</span> nhợt nhạt.";
				} else {
					if (hasVision) desc += "";
					else desc += "Không có <span class='hl-functionality'>ánh sáng</span>. ";
				}
			}

			// world features
			if (hasLight) {
				let features = featuresComponent.levelFeatures;
				for (let i = 0; i < features.length; i++) {
					let featureType = features[i];
					desc += this.getLevelFeatureDescription(sector, featureType);
				}
			}
			
			// locales / POIs description
			for (let i = 0; i < localesComponent.locales.length; i++) {
				let locale = localesComponent.locales[i];
				if (!this.isLocaleVisible(locale)) continue;
				if (sectorStatus.isLocaleScouted(i)) {
					if (locale.type == localeTypes.tradingpartner) {
						var partner = TradeConstants.getTradePartner(campOrdinal);
						if (partner) {
							desc += "<span class='hl-functionality'>" + partner.name + "</span> ở đây. ";
						}
					}
				}
			}

			return desc;
		},

		getLevelFeatureDescription: function (sector, featureType) {
			switch (featureType) {
				case WorldConstants.FEATURE_HOLE_COLLAPSE_EDGE:
					let directionToCollapse = GameGlobals.levelHelper.getDirectionToFeature(sector, WorldConstants.FEATURE_HOLE_COLLAPSE);
					return "Khu vực về phía " + directionToCollapse + " đã sụp đổ.";
				case WorldConstants.FEATURE_HOLE_WELL_EDGE:
					let directionToWell = GameGlobals.levelHelper.getDirectionToFeature(sector, WorldConstants.FEATURE_HOLE_WELL);
					return "Khu vực được chiếu sáng bởi một giếng nắng gần đó.";
				case WorldConstants.FEATURE_HOLE_MOUNTAIN_EDGE:
					let directionToMountain = GameGlobals.levelHelper.getDirectionToFeature(sector, WorldConstants.FEATURE_HOLE_MOUNTAIN);
					return "Một ngọn núi chắn ngang Thành phố về phía " + PositionConstants.getDirectionName(directionToMountain);
				case WorldConstants.FEATURE_STRUCTURE_PILLAR:
					return "Khu vực bị một trụ bê tông khổng lồ chi phối, một trong những xương sống lớn của Thành phố. ";
				case WorldConstants.FEATURE_TRAIN_TRACKS_NEW:
				case WorldConstants.FEATURE_TRAIN_TRACKS_OLD:
					return "Đường ray xe lửa chạy ngang qua khu vực."

			}
		},

		// Existing improvements. Workshops. Potential improvements (camp).
		getFunctionalDescription: function (hasVision, isScouted, featuresComponent, workshopComponent, hasCampHere, hasCampOnLevel) {
			let currentSector = this.playerLocationNodes.head.entity;
			let positionComponent = currentSector.get(PositionComponent);
			let position = positionComponent.getPosition();

			var sectorControlComponent = this.playerLocationNodes.head.entity.get(SectorControlComponent);
			var sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);
			var improvements = this.playerLocationNodes.head.entity.get(SectorImprovementsComponent);

			var description = "";

			if (isScouted && featuresComponent.hasSpring) {
				description += "Có <span class='hl-functionality'>" + TextConstants.getSpringName(featuresComponent) + "</span> ở đây. ";
			}

			if (isScouted) {
				let canBucket = featuresComponent.resourcesCollectable.water > 0;
				let canTrap = featuresComponent.resourcesCollectable.food > 0;
				
				if (canBucket && canTrap) {
					description += "Có thể thu thập cả <span class='hl-functionality'>nước</span> và <span class='hl-functionality'>thức ăn</span> ở đây. ";
				} else if (canBucket) {
					if (featuresComponent.sunlit) {
						description += "Có vẻ có thể thu thập <span class='hl-functionality'>nước mưa</span> ở đây. ";
					} else {
						description += "Có một ít <span class='hl-functionality'>nước</span> rò rỉ ở đây có thể thu thập được. ";
					}
				} else if (canTrap) {
					description += "Có lẽ nên đặt <span class='hl-functionality'>bẫy</span> ở đây. ";
				}

				if (featuresComponent.heapResource) {
					let heapDisplayName = 
						"<span class='hl-functionality'>" +
						Text.addArticle(TextConstants.getHeapDisplayName(featuresComponent.heapResource, featuresComponent)) +
						"</span>";
					let resourceDisplayName = TextConstants.getResourceDisplayName(featuresComponent.heapResource);
					if (sectorStatus.getHeapScavengedPercent() >= 100) {
						description += "Có " + heapDisplayName + ", nhưng đã bị vét sạch. ";
					} else {
						description += "Có " + heapDisplayName + ", có thể lục lọi để tìm " + resourceDisplayName + ". ";
					}
				}
			}

			if (hasCampHere) {
				let campComponent = this.playerLocationNodes.head.entity.get(CampComponent);
				let campOrdinal = GameGlobals.worldState.getCampOrdinal(position.level);
				let isOutpost = GameGlobals.campBalancingHelper.isOutpost(campOrdinal);
				let campTerm = TextConstants.getCampTerm(isOutpost);
				let campModifier = TextConstants.getCampModifier(campComponent, improvements);

				description += Text.t("ui.exploration.sector_features_camp_description", { noun: campTerm, modifier: campModifier });
			}

			if (isScouted && featuresComponent.examineSpots.length > 0) {
				for (let i = 0; i < featuresComponent.examineSpots.length; i++) {
					let spotID = featuresComponent.examineSpots[i];
					let spotDef = StoryConstants.getSectorExampineSpot(spotID);
					if (!spotDef) continue;
					description += "Có " + Text.t(spotDef.nameKey) + " ở đây. ";
				}
			}

			if (isScouted && workshopComponent && workshopComponent.isClearable) {
				var workshopName = TextConstants.getWorkshopName(workshopComponent.resource);
				var workshopControl = sectorControlComponent.hasControlOfLocale(LocaleConstants.LOCALE_ID_WORKSHOP);
				var workshopStatus = workshopControl ? "đã dọn để sử dụng" : "chưa dọn dẹp";
				description += "Có <span class='hl-functionality'>" + Text.addArticle(workshopName) + "</span> ở đây (" + workshopStatus + "). ";
			}

			if (isScouted && improvements.getCount(improvementNames.greenhouse) > 0) {
				description += "Có một <span class='hl-functionality'>nhà kính</span> ở đây. ";
			}
			
			let luxuryResource = GameGlobals.sectorHelper.getLuxuryResourceOnSector(this.playerLocationNodes.head.entity, true);
			if (isScouted && luxuryResource) {
				description += "Có nguồn <span class='hl-functionality'>" + TribeConstants.getLuxuryDisplayName(luxuryResource) + "</span> ở đây. ";
			}
			
			if (isScouted && GameGlobals.levelHelper.isFirstScoutedSectorWithFeatureOnLevel(this.playerLocationNodes.head.entity, "hasTradeConnectorSpot")) {
				description += "Ở đây có chỗ cho một dự án xây dựng lớn hơn. ";
			}

			return description;
		},

		// Found resources, enemies
		getStatusDescription: function (hasVision, isScouted, hasEnemies, featuresComponent, passagesComponent, hasCampHere, hasCampOnLevel) {
			let description = "";

			// Scouted status
			if (hasVision && !isScouted) {
				description += Text.t("ui.exploration.sector_status_not_scouted_description");
			}

			// Danger
			if (hasVision) {
				description += this.getDangerDescription(isScouted, featuresComponent, hasCampHere);
			}
			
			// Waymarks
			if (isScouted) {
				for (let i = 0; i < featuresComponent.waymarks.length; i++) {
					let waymark = featuresComponent.waymarks[i];
					description += this.getWaymarkText(waymark) + ". ";
				}
			}

			// Camp
			if (isScouted && hasVision && !hasCampHere && !hasCampOnLevel) {
				if (featuresComponent.canHaveCamp() && !hasEnemies && !passagesComponent.passageUp && !passagesComponent.passageDown)
					description += "Đây sẽ là nơi phù hợp để dựng <span class='hl-functionality'>trại</span>. ";
			}

			return description;
		},

		getResourcesDescription: function (isScouted, featuresComponent, statusComponent) {
			if (!featuresComponent) return;
			let description = "";

			if (isScouted && GameGlobals.gameState.unlockedFeatures.scavenge) {
				description += Text.t("ui.exploration.sector_status_scavenged_percent_field", UIConstants.roundValue(Math.floor(statusComponent.getScavengedPercent())));
				description += "<br />";
			}

			if (this.showInvestigate()) {
				let investigatedPercent = statusComponent.getInvestigatedPercent();
				let investigationComplete = investigatedPercent >= 100;
				if (investigationComplete) {
					description += Text.t("ui.exploration.sector_status_investigated_percent_field_completed", Math.floor(investigatedPercent));
				} else {
					description += Text.t("ui.exploration.sector_status_investigated_percent_field_default", Math.floor(investigatedPercent));
				}
				description += "<br/>";
			}
			
			let scavengedPercent = statusComponent.getScavengedPercent();
			let discoveredResources = GameGlobals.sectorHelper.getLocationDiscoveredResources();
			let knownResources = GameGlobals.sectorHelper.getLocationKnownResources();
			
			let resourcesFoundValueText = "";
			if (knownResources.length > 0) {
				resourcesFoundValueText = TextConstants.getScaResourcesString(discoveredResources, knownResources, featuresComponent.resourcesScavengable);
			} else if (scavengedPercent >= ExplorationConstants.THRESHOLD_SCAVENGED_PERCENT_REVEAL_NO_RESOURCES) {
				if (featuresComponent.resourcesScavengable.getTotal() > 0) {
					resourcesFoundValueText = Text.t("ui.common.value_unknown");
				} else {
					resourcesFoundValueText = Text.t("ui.common.list_template_zero");
				}
			} else {
				resourcesFoundValueText = Text.t("ui.common.value_unknown");
			}
			description += Text.t("ui.exploration.sector_status_resources_found_field", resourcesFoundValueText);
			description += "<br />";
			
			if (featuresComponent.itemsScavengeable.length > 0) {
				let discoveredItems = GameGlobals.sectorHelper.getLocationDiscoveredItems();
				let knownItems = GameGlobals.sectorHelper.getLocationKnownItems();
				let showIngredients = GameGlobals.sectorHelper.hasSectorVisibleIngredients();
				if (showIngredients) {
					description += Text.t("ui.exploration.sector_status_items_found_field", TextConstants.getScaItemString(discoveredItems, knownItems, featuresComponent.itemsScavengeable));
					description += "<br />";
				}
			}

			return description;
		},

		getMovementDescription: function (isScouted, passagesComponent, entity) {
			var description = "";
			var improvements = this.playerLocationNodes.head.entity.get(SectorImprovementsComponent);
			var position = entity.get(PositionComponent);

			// Passages up / down
			var passageUpBuilt = improvements.getCount(improvementNames.passageUpStairs) +
				improvements.getCount(improvementNames.passageUpElevator) +
				improvements.getCount(improvementNames.passageUpHole) > 0;
			var passageDownBuilt = improvements.getCount(improvementNames.passageDownStairs) +
				improvements.getCount(improvementNames.passageDownElevator) +
				improvements.getCount(improvementNames.passageDownHole) > 0;

			if (isScouted) {
				if (passagesComponent.passageUp)
					description += TextConstants.getPassageDescription(passagesComponent.passageUp, PositionConstants.DIRECTION_UP, passageUpBuilt) + " ";
				if (passagesComponent.passageDown)
					description += TextConstants.getPassageDescription(passagesComponent.passageDown, PositionConstants.DIRECTION_DOWN, passageDownBuilt) + " ";
			}

			// Blockers n/s/w/e
			for (let i in PositionConstants.getLevelDirections()) {
				var direction = PositionConstants.getLevelDirections()[i];
				var directionName = PositionConstants.getDirectionName(direction);
				var blocker = passagesComponent.getBlocker(direction);

				if (blocker) {
					var gangComponent = GameGlobals.levelHelper.getGangComponent(position, direction);
					var blockerName = TextConstants.getMovementBlockerName(blocker, gangComponent).toLowerCase();
					if (GameGlobals.movementHelper.isBlocked(entity, direction)) {
						switch (blocker.type) {
							case MovementConstants.BLOCKER_TYPE_DEBRIS:
							case MovementConstants.BLOCKER_TYPE_WASTE_TOXIC:
							case MovementConstants.BLOCKER_TYPE_WASTE_RADIOACTIVE:
								description += "Lối đi về phía " + directionName + " bị chặn bởi <span class='hl-functionality'>" + blockerName + "</span>. ";
								break;
							default:
								description += "Lối đi về phía " + directionName + " bị chặn bởi một <span class='hl-functionality'>" + blockerName + "</span>. ";
								break;
						}
					} else {
						var gang = GameGlobals.levelHelper.getGang(position, direction);
						if (blocker.type == MovementConstants.BLOCKER_TYPE_DEBRIS) {
							description += "Đống đổ nát về phía " + directionName + " đã được dọn sạch. ";
						} else if (blocker.type == MovementConstants.BLOCKER_TYPE_EXPLOSIVES) {
							description += "Chất nổ cũ về phía " + directionName + " đã được dọn sạch. ";
						} else if (blocker.type == MovementConstants.BLOCKER_TYPE_GANG) {
							if (gang) {
								description += "Một " + blockerName + " về phía " + directionName + " đã được " + TextConstants.getUnblockedVerb(blocker.type) + ". ";
							} else {
								log.w("gang blocker but no gang component at " + position, this);
							}
						} else {
							description += "Một " + blockerName + " về phía " + directionName + " đã được " + TextConstants.getUnblockedVerb(blocker.type) + ". ";
						}
					}
				}
			}

			return description;
		},

		getDangerDescription: function (isScouted, featuresComponent, hasCampOnLevel) {
			let sectorControlComponent = this.playerLocationNodes.head.entity.get(SectorControlComponent);
			let sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);
			let enemiesComponent = this.playerLocationNodes.head.entity.get(EnemiesComponent);
			let hasEnemies = enemiesComponent.hasEnemies;

			let levelEntity = GameGlobals.levelHelper.getLevelEntityForSector(this.playerLocationNodes.head.entity);
			let levelComponent = levelEntity.get(LevelComponent);

			let enemyDesc = "";

			if (hasEnemies) {
				if (isScouted) {
					enemyDesc = "Khu vực này " + TextConstants.getEnemyText(enemiesComponent.possibleEnemies, sectorControlComponent).toLowerCase() + ". ";
				}
			} else if (isScouted) {
				enemyDesc += Text.t("ui.exploration.sector_status_no_enemies_description");
				enemyDesc += Text.t("ui.common.sentence_separator");
			}

			var notCampableDesc = "";
			if (isScouted) {
				if (!featuresComponent.campable) {
					var inhabited = featuresComponent.level > 10;
					switch (levelComponent.notCampableReason) {
						case LevelConstants.UNCAMPABLE_LEVEL_TYPE_RADIATION:
							if (inhabited && featuresComponent.wear < 6)
								notCampableDesc = "Nhiều lối vào có biển cảnh báo màu vàng lớn ghi 'CẤM VÀO' cùng biểu tượng <span class='hl-functionality'>phóng xạ</span>. ";
							else if (inhabited && featuresComponent.buildingDensity > 5)
								notCampableDesc = "Tường phủ đầy hình vẽ cảnh báo về <span class='hl-functionality'>phóng xạ</span>. ";
							else
								notCampableDesc = "Không khí rợn ngợp như thể nơi này đã bị <span class='hl-functionality'>bỏ hoang</span> vội vã. ";
							break;

						case LevelConstants.UNCAMPABLE_LEVEL_TYPE_POLLUTION:
							if (inhabited && featuresComponent.wear < 6)
								notCampableDesc = "Nhiều lối vào có biển cảnh báo màu đỏ lớn với biểu tượng <span class='hl-functionality'>đầu lâu</span> và dòng 'CẤM VÀO'. ";
							else if (inhabited && featuresComponent.buildingDensity > 5)
								notCampableDesc = "Tường phủ đầy hình vẽ cảnh báo về một dạng <span class='hl-functionality'>ô nhiễm</span>. ";
							else
								notCampableDesc = "Một <span class='hl-functionality'>mùi hôi độc hại</span> lơ lửng trong không khí. ";
							break;

						case LevelConstants.UNCAMPABLE_LEVEL_TYPE_SUPERSTITION:
							if (inhabited)
								notCampableDesc = "Không có dấu hiệu <span class='hl-functionality'>con người sinh sống</span> gần đây. ";
							else
								notCampableDesc = "Một <span class='hl-functionality'>sự im lặng</span> đáng sợ bao trùm các con phố. ";
							break;
					}
				}
			}

			var hasHazards = GameGlobals.sectorHelper.hasHazards(featuresComponent, sectorStatus);
			var hazards = GameGlobals.sectorHelper.getEffectiveHazards(featuresComponent, sectorStatus);
			var hazardDesc = "";
			if (hasHazards) {
				if (hazards.radiation > 0) {
					hazardDesc += "Nơi này có <span class='hl-functionality'>phóng xạ</span> (" + hazards.radiation + "). ";
				}
				if (hazards.poison > 0) {
					hazardDesc += "Nơi này bị <span class='hl-functionality'>ô nhiễm</span> nghiêm trọng (" + hazards.poison + "). ";
				}
				if (hazards.cold > 0) {
					let coldAdjective = hazards.cold < 20 ? "khá" : hazards.cold < 50 ? "rất" : "cực kỳ";
					hazardDesc += "Ở đây " + coldAdjective + " <span class='hl-functionality'>lạnh</span> (" + hazards.cold + "). ";
				}
				if (hazards.flooded > 0) {
					hazardDesc += "Nơi này bị <span class='hl-functionality'>ngập</span>. ";
				}
				if (hazards.debris > 0) {
					hazardDesc += "Rất khó di chuyển ở đây vì có quá nhiều <span class='hl-functionality'>đống đổ nát</span>.";
				}
				if (hazards.territory > 0) {
					hazardDesc += "Khu vực này là <span class='hl-functionality'>lãnh địa băng nhóm</span>.";
				}
			}

			return enemyDesc + (hasHazards ? hazardDesc : notCampableDesc);
		},

		updateOutImprovementsList: function (improvements) {
			if (!this.playerLocationNodes.head) return;
			if (GameGlobals.playerHelper.isInCamp()) return;
			var improvements = this.playerLocationNodes.head.entity.get(SectorImprovementsComponent);
			var uiFunctions = GameGlobals.uiFunctions;
			var numVisible = 0;
			$.each(this.elements.outImprovementsTR, function () {
				var actionName = $(this).attr("btn-action");

				if (!actionName) {
					actionName = $(this).find("button.action-build").attr("action");
					$(this).attr("btn-action", actionName);
				}

				if (actionName) {
					let improvementName = GameGlobals.playerActionsHelper.getImprovementNameForAction(actionName);
					if (improvementName) {
						let actionVisible = GameGlobals.playerActionsHelper.isVisible(actionName);
						let existingImprovements = improvements.getCount(improvementName);
						$(this).find(".list-amount").text(existingImprovements);
						GameGlobals.uiFunctions.toggle($(this).find(".action-use"), existingImprovements > 0);

						let isVisible = actionVisible || existingImprovements > 0;
						GameGlobals.uiFunctions.toggle($(this), isVisible);
						if (isVisible) numVisible++;
					}
				}
			});
			GameGlobals.uiFunctions.toggle("#header-out-improvements", numVisible > 0);
		},

		updateOutImprovementsStatus: function () {
			if (!this.playerLocationNodes.head) return;
			var improvements = this.playerLocationNodes.head.entity.get(SectorImprovementsComponent);
			var hasCamp = GameGlobals.levelHelper.getLevelEntityForSector(this.playerLocationNodes.head.entity).has(CampComponent);
		
			var collectorFood = improvements.getVO(improvementNames.collector_food);
			var collectorWater = improvements.getVO(improvementNames.collector_water);
			var collectorFoodCapacity = collectorFood.storageCapacity.food * collectorFood.count;
			var collectorWaterCapacity = collectorWater.storageCapacity.water * collectorWater.count;
			$("#out-improvements-collector-food .list-storage").text(
				collectorFoodCapacity > 0 ? (Math.floor(collectorFood.storedResources.food * 10) / 10) + " / " + collectorFoodCapacity : "");
			$("#out-improvements-collector-water .list-storage").text(
				collectorWaterCapacity > 0 ? (Math.floor(collectorWater.storedResources.water * 10) / 10) + " / " + collectorWaterCapacity : "");
				
			let bucketMaxLevel = GameGlobals.campHelper.getCurrentMaxImprovementLevel(improvementNames.collector_water);
			let trapMaxLevel = GameGlobals.campHelper.getCurrentMaxImprovementLevel(improvementNames.collector_food);
				
			GameGlobals.uiFunctions.toggle("#out-action-improve-bucket", collectorWaterCapacity > 0 && bucketMaxLevel > 1);
			GameGlobals.uiFunctions.toggle("#out-action-improve-trap", collectorFoodCapacity > 0 && trapMaxLevel > 1);
			
			let hasBeacon = improvements.getCount(improvementNames.beacon);
			GameGlobals.uiFunctions.toggle("#out-action-dismantle-beacon", hasBeacon);
		},

		updateLocales: function () {
			if (!this.playerLocationNodes.head) return;

			let currentSector = this.playerLocationNodes.head.entity;
			let positionComponent = currentSector.get(PositionComponent);
			let position = positionComponent.getPosition();
			let campOrdinal = GameGlobals.worldState.getCampOrdinal(position.level);
			let sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);

			let isScouted = sectorStatus.scouted;
			
			let sectorFeaturesComponent = currentSector.get(SectorFeaturesComponent);
			let sectorStatusComponent = currentSector.get(SectorStatusComponent);

			let locales = this.getVisibleLocales();
			
			let data = locales.map((locale) => {
				let index = locale.index;
				let isScouted = sectorStatusComponent.isLocaleScouted(index);
				let result = {};
				result.campOrdinal = campOrdinal;
				result.position = position;
				result.index = index;
				result.locale = locale;
				result.isScouted = isScouted;
				result.sectorFeaturesComponent = sectorFeaturesComponent;
				return result;
			});
			
			let numNewItems = UIList.update(this.localeList, data).length;
			
			if (numNewItems > 0) {
				GameGlobals.buttonHelper.updateButtonDisabledStates("#table-out-actions-locales", true);
				GameGlobals.uiFunctions.createButtons("#table-out-actions-locales");
				GlobalSignals.elementCreatedSignal.dispatch();
			}
		},
		
		createLocaleListItem: function () {
			let li = {};
			let button = "<button class='action multiline'></button>";
			let info = "<span class='p-meta'></span";
			li.$root = $("<tr><td>" + button + "</td><td>" + info + "</td></tr>");
			li.$button = li.$root.find("button");
			li.$info = li.$root.find("span");
			return li;
		},
		
		isLocaleListItemDataSame: function (d1, d2) {
			return d1.index == d2.index && d1.position.equals(d2.position) && d1.isScouted == d2.isScouted;
		},
		
		updateLocaleListItem: function (li, data) {
			let locale = data.locale;
			
			li.$button.attr("action", "scout_locale_" + locale.getCategory() + "_" + data.index);
			li.$button.find(".btn-label").html(TextConstants.getLocaleName(locale, data.sectorFeaturesComponent));

			let isScouted = data.isScouted;
			let canBeScouted = !isScouted || LocaleConstants.canBeScoutedAgain(locale.type);
			
			let info = "";
			if (!canBeScouted) {
				if (locale.type == localeTypes.tradingpartner) {
					let partner = TradeConstants.getTradePartner(data.campOrdinal);
					if (partner) {
						info += "Đã thám sát (" + partner.name + ")";
					} else {
						info += "Đã thám sát";
					}
				} else if (locale.luxuryResource != null) {
					info += "Đã thám sát (" + TribeConstants.getLuxuryDisplayName(locale.luxuryResource) + ")";
				} else {
					info += "Đã thám sát";
				}
			}
			li.$info.html(info);
		},

		updateMovementActions: function () {
			let activeDespairType = GameGlobals.playerHelper.getActiveDespairType();
			let showGrit = activeDespairType == MovementConstants.DESPAIR_TYPE_HUNGRER || activeDespairType == MovementConstants.DESPAIR_TYPE_THIRST;
			GameGlobals.uiFunctions.toggle(".movement-action-normal", !showGrit);
			GameGlobals.uiFunctions.toggle(".movement-action-grit", showGrit);
		},

		updateCharacters: function () {
			$("#out-characters").empty();

			if (!this.playerLocationNodes.head) return;

			let sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);
			let hasCharacters = sectorStatus.currentCharacters.length > 0;
			let isScouted = sectorStatus.scouted;
			let showCharacters = hasCharacters && isScouted;

			GameGlobals.uiFunctions.toggle($("#header-out-characters"), showCharacters);
			GameGlobals.uiFunctions.toggle($("#out-characters"), showCharacters);

			if (!showCharacters) return;

			for (let i = 0; i < sectorStatus.currentCharacters.length; i++) {
				let character = sectorStatus.currentCharacters[i];

				let talkAction = "start_out_npc_dialogue_" + character.instanceID;

				let randomIndex = character.randomIndex || character.instanceID || 0;
				let div = UIConstants.getNPCDiv(character.characterType, talkAction, randomIndex);
				$("#out-characters").append(div);
			}

			GameGlobals.uiFunctions.createButtons("#out-characters");
			GameGlobals.uiFunctions.generateInfoCallouts("#out-characters");
		},

		updateMovementRelatedActions: function () {
			if (!this.playerLocationNodes.head) return;
			if (GameGlobals.playerHelper.isInCamp()) return;

			var currentSector = this.playerLocationNodes.head.entity;
			var movementOptionsComponent = currentSector.get(MovementOptionsComponent);
			var enemiesComponent = currentSector.get(EnemiesComponent);
			var enemiesComponent = currentSector.get(PositionComponent);
			var position = currentSector.get(PositionComponent).getPosition();
			$("#container-out-actions-movement-related").empty();

			let sys = this;

			function addBlockerActionButton(blocker, direction) {
				if (blocker.type === MovementConstants.BLOCKER_TYPE_GAP) return;
				if (movementOptionsComponent.canMoveToDirection(direction)) return;

				let directionName = PositionConstants.getDirectionName(direction, true);

				if (blocker.type === MovementConstants.BLOCKER_TYPE_TOLL_GATE) {
					let button = $("<button>tiếp cận trạm thu phí (" + directionName + ")</button>");
					button.data("direction", direction);
					button.click(ExceptionHandler.wrapClick((e) => sys.onApproachTollGateButtonClicked(e)));
					$("#container-out-actions-movement-related").append(button);
				} else {
					let action = blocker.actionBaseID + "_" + direction;
					let gangComponent = GameGlobals.levelHelper.getGangComponent(position, direction);
					let description = TextConstants.getMovementBlockerAction(blocker, enemiesComponent, gangComponent) + " (" + directionName + ")";
					let button = "<button class='action' action='" + action + "'>" + description + "</button>";
					$("#container-out-actions-movement-related").append(button);
				}
			}

			for (let i in PositionConstants.getLevelDirections()) {
				var direction = PositionConstants.getLevelDirections()[i];
				var directionBlocker = GameGlobals.movementHelper.getBlocker(currentSector, direction);
				if (directionBlocker && !GameGlobals.movementHelper.isProjectBlocker(directionBlocker.type)) {
					addBlockerActionButton(directionBlocker, direction);
				}
			}

			GameGlobals.uiFunctions.createButtons("#container-out-actions-movement-related");
			GameGlobals.uiFunctions.updateButtonCooldowns("#container-out-actions-movement-related");
			
			GlobalSignals.elementCreatedSignal.dispatch();
		},

		updateSectorDescription: function () {
			if (GameGlobals.gameState.uiStatus.isHidden) return;
			var featuresComponent = this.playerLocationNodes.head.entity.get(SectorFeaturesComponent);
			var sectorStatus = this.playerLocationNodes.head.entity.get(SectorStatusComponent);

			var sector = this.playerLocationNodes.head.entity;
			var vision = this.playerPosNodes.head.entity.get(VisionComponent).value;
			var hasVision = vision > PlayerStatConstants.VISION_BASE;
			var hasCampOnLevel = GameGlobals.levelHelper.getLevelEntityForSector(this.playerLocationNodes.head.entity).has(CampComponent);
			var hasCampHere = this.playerLocationNodes.head.entity.has(CampComponent);
			var isScouted = sectorStatus.scouted;

			// Header
			var features = GameGlobals.sectorHelper.getTextFeatures(sector);
			this.elements.sectorHeader.text(TextConstants.getSectorHeader(hasVision, features));

			// Description
			this.elements.description.html(this.getDescription(
				sector,
				hasCampHere,
				hasCampOnLevel,
				hasVision,
				isScouted
			));
		},

		updateLocationDetails: function () {
			let hasFirstCamp = GameGlobals.gameState.numCamps > 0;
			let hasCampOnLevel = GameGlobals.levelHelper.getLevelEntityForSector(this.playerLocationNodes.head.entity).has(CampComponent);
			let pathToCamp = GameGlobals.playerHelper.getPathToCamp();
			let pathToCampLen = pathToCamp ? pathToCamp.length : "?";
			let canMove = GameGlobals.gameState.isFeatureUnlocked("move");
			
			$("#out-action-move-camp-details").text("(" + pathToCampLen + " ô)");
			
			let showDistanceIndicator = hasFirstCamp && canMove;
			GameGlobals.uiFunctions.toggle($("#out-distance-indicator"), showDistanceIndicator);
			if (showDistanceIndicator) {
				if (hasCampOnLevel) {
					$("#out-distance-indicator").text(Text.t("ui.exploration.current_distance_to_camp_field", pathToCampLen));
				} else {
					let pathToPassage = GameGlobals.playerHelper.getPathToPassage();
					let pathToPassageLen = pathToPassage ? pathToPassage.length : "?";
					$("#out-distance-indicator").text(Text.t("ui.exploration.current_distance_to_passage_field", pathToPassageLen));
				}
			}
		},

		rebuildVis: function () {
			if (GameGlobals.gameState.uiStatus.isHidden) return;
			if (!this.playerLocationNodes.head) return;
			if (GameGlobals.playerHelper.isInCamp()) return;

			this.pendingUpdateMap = false;
			
			let mapPosition = this.playerLocationNodes.head.position.getPosition();
			GameGlobals.uiMapHelper.rebuildMapHints("minimap-background", "minimap", mapPosition);
			GameGlobals.uiMapHelper.rebuildMap("minimap", null, mapPosition, UIConstants.MAP_MINIMAP_SIZE, true, MapUtils.MAP_MODE_DEFAULT);
		},
		
		showInvestigate: function () {
			return GameGlobals.playerActionsHelper.isVisible("investigate");
		},
		
		getResourceCurrentlyAvailableToCollect: function (resourceName) {
			var improvements = this.playerLocationNodes.head.entity.get(SectorImprovementsComponent);
			var collectorName = GameGlobals.sectorHelper.getCollectorName(resourceName);
			var collector = improvements.getVO(collectorName);
			var availableResource = collector.storedResources[resourceName];
			return availableResource || 0;
		},
		
		getWaymarkText: function (waymarkVO) {
			let pos = waymarkVO.fromPosition;
			let sector = GameGlobals.levelHelper.getSectorByPosition(pos.level, pos.sectorX, pos.sectorY);
			let sectorFeatures = GameGlobals.sectorHelper.getTextFeatures(sector);
			return TextConstants.getWaymarkText(waymarkVO, sectorFeatures);
		},

		onApproachTollGateButtonClicked: function (e) {
			GlobalSignals.triggerSoundSignal.dispatch(UIConstants.soundTriggerIDs.buttonClicked);
			let $btn = $(e.currentTarget);
			let direction = $btn.data("direction");
			this.showTollGatePopup(direction);
		},

		onPopupClosed: function () {
			this.updateLocales();
			this.updateCharacters();
		},
		
		onButtonStateChanged: function (action, isEnabled) {
			switch (action) {
				case "use_out_collector_water":
				case "use_out_collector_water_one":
				case "use_out_collector_food":
				case "use_out_collector_food_one":
					this.updateOutImprovementsStatus();
					break;
			}
		},
	});

	return UIOutLevelSystem;
});
