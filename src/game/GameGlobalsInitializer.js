define([
	'text/TextLoader',
	'game/GameGlobals',
	'game/constants/WorldConstants',
	'game/GameState',
	'game/GameFlowLogger',
	'game/MetaState',
	'game/WorldState',
	'game/PlayerActionFunctions',
	'game/UIFunctions',
	'game/helpers/CampHelper',
	'game/helpers/CampBalancingHelper',
	'game/helpers/CampVisHelper',
	'game/helpers/DialogueHelper',
	'game/helpers/ExplorerHelper',
	'game/helpers/FightHelper',
	'game/helpers/ItemsHelper',
	'game/helpers/LevelHelper',
	'game/helpers/MilestoneEffectsHelper',
	'game/helpers/MovementHelper',
	'game/helpers/PlayerHelper',
	'game/helpers/PlayerActionsHelper',
	'game/helpers/PlayerActionResultsHelper',
	'game/helpers/ResourcesHelper',
	'game/helpers/SaveHelper',
	'game/helpers/SectorHelper',
	'game/helpers/StoryHelper',
	'game/helpers/TribeBalancingHelper',
	'game/helpers/TribeHelper',
	'game/helpers/UpgradeEffectsHelper',
	'game/helpers/ButtonHelper',
	'game/helpers/WorldHelper',
	'game/helpers/ui/AccessibilityOverviewCleanupPatch',
	'game/helpers/ui/AccessibilityFocusStabilityPatch',
	'game/helpers/ui/AccessibilityActionCalloutHelper',
	'game/helpers/ui/AccessibilityB1Helper',
	'game/helpers/ui/AccessibilityB2Helper',
	'game/helpers/ui/AccessibilityCollapsibleHelper',
	'game/helpers/ui/AccessibilityControlHelper',
	'game/helpers/ui/AccessibilityDialogueHelper',
	'game/helpers/ui/AccessibilityFightHelper',
	'game/helpers/ui/AccessibilityFinalAuditHelper',
	'game/helpers/ui/AccessibilityHelper',
	'game/helpers/ui/AccessibilityIndicatorHelper',
	'game/helpers/ui/AccessibilityMapHelper',
	'game/helpers/ui/AccessibilityMobileOverlayHelper',
	'game/helpers/ui/AccessibilityNavigationHelper',
	'game/helpers/ui/AccessibilityPopupHelper',
	'game/helpers/ui/AccessibilityProgressHelper',
	'game/helpers/ui/AccessibilityScreenHelper',
	'game/helpers/ui/AccessibilityStructureHelper',
	'game/helpers/ui/AccessibilityTabStatusHelper',
	'game/helpers/ui/AccessibilityTechTreeHelper',
	'game/helpers/ui/ChangeLogHelper',
	'game/helpers/ui/UIMapHelper',
	'game/helpers/ui/UITechTreeHelper',
], function (
	TextLoader,
	GameGlobals,
	WorldConstants,
	GameState,
	GameFlowLogger,
	MetaState,
	WorldState,
	PlayerActionFunctions,
	UIFunctions,
	CampHelper,
	CampBalancingHelper,
	CampVisHelper,
	DialogueHelper,
	ExplorerHelper,
	FightHelper,
	ItemsHelper,
	LevelHelper,
	MilestoneEffectsHelper,
	MovementHelper,
	PlayerHelper,
	PlayerActionsHelper,
	PlayerActionResultsHelper,
	ResourcesHelper,
	SaveHelper,
	SectorHelper,
	StoryHelper,
	TribeBalancingHelper,
	TribeHelper,
	UpgradeEffectsHelper,
	ButtonHelper,
	WorldHelper,
	AccessibilityOverviewCleanupPatch,
	AccessibilityFocusStabilityPatch,
	AccessibilityActionCalloutHelper,
	AccessibilityB1Helper,
	AccessibilityB2Helper,
	AccessibilityCollapsibleHelper,
	AccessibilityControlHelper,
	AccessibilityDialogueHelper,
	AccessibilityFightHelper,
	AccessibilityFinalAuditHelper,
	AccessibilityHelper,
	AccessibilityIndicatorHelper,
	AccessibilityMapHelper,
	AccessibilityMobileOverlayHelper,
	AccessibilityNavigationHelper,
	AccessibilityPopupHelper,
	AccessibilityProgressHelper,
	AccessibilityScreenHelper,
	AccessibilityStructureHelper,
	AccessibilityTabStatusHelper,
	AccessibilityTechTreeHelper,
	ChangeLogHelper,
	UIMapHelper,
	UITechTreeHelper,
) {
	let GameGlobalsInitializer = {
		
		init: function (engine, gameManager, headless) {
			GameGlobals.engine = engine;
			GameGlobals.gameManager = gameManager;

			GameGlobals.gameState = new GameState();
			GameGlobals.metaState = new MetaState();
			GameGlobals.worldState = new WorldState();
			
			GameGlobals.playerActionsHelper = new PlayerActionsHelper(engine);

			if (engine) {
				GameGlobals.playerActionFunctions = new PlayerActionFunctions(engine);
			}
			
			GameGlobals.upgradeEffectsHelper = new UpgradeEffectsHelper();
			GameGlobals.milestoneEffectsHelper = new MilestoneEffectsHelper();
			GameGlobals.itemsHelper = new ItemsHelper();
			GameGlobals.campHelper = new CampHelper(engine);
			GameGlobals.campBalancingHelper = new CampBalancingHelper();
			GameGlobals.dialogueHelper = new DialogueHelper(engine);
			GameGlobals.worldHelper = new WorldHelper();

			// A new game has no saved world template to compare against. WorldHelper 0.7.1
			// assumes one exists when detecting world changes, which throws on fresh starts.
			let originalDetectWorldChanges = GameGlobals.worldHelper.detectWorldChanges;
			GameGlobals.worldHelper.detectWorldChanges = function (worldVO, worldTemplateVO, levels) {
				if (!worldTemplateVO) {
					return {
						changes: [],
						worldGeneratorVersion: WorldConstants.version,
						worldVersion: worldVO ? worldVO.version : null,
						worldTemplateVersion: null,
					};
				}
				return originalDetectWorldChanges.call(this, worldVO, worldTemplateVO, levels);
			};

			GameGlobals.tribeBalancingHelper = new TribeBalancingHelper();
			GameGlobals.textLoader = new TextLoader();
			
			if (engine) {
				GameGlobals.changeLogHelper = new ChangeLogHelper();
				GameGlobals.explorerHelper = new ExplorerHelper(engine);
				GameGlobals.fightHelper = new FightHelper(engine);
				GameGlobals.gameFlowLogger = new GameFlowLogger();
				GameGlobals.levelHelper = new LevelHelper(engine);
				GameGlobals.movementHelper = new MovementHelper(engine);
				GameGlobals.playerActionResultsHelper = new PlayerActionResultsHelper(engine);
				GameGlobals.playerHelper = new PlayerHelper(engine);
				GameGlobals.resourcesHelper = new ResourcesHelper(engine);
				GameGlobals.saveHelper = new SaveHelper();
				GameGlobals.sectorHelper = new SectorHelper(engine);
				GameGlobals.storyHelper = new StoryHelper(engine);
				GameGlobals.tribeHelper = new TribeHelper(engine);
			}

			if (engine) {
				GameGlobals.uiMapHelper = new UIMapHelper(engine);
				GameGlobals.uiTechTreeHelper = new UITechTreeHelper(engine);
				GameGlobals.buttonHelper = new ButtonHelper();
				GameGlobals.campVisHelper = new CampVisHelper();
			}
			
			if (!headless) {
				GameGlobals.uiFunctions = new UIFunctions();

				let safeInitAccessibility = function (propertyName, factory) {
					try {
						GameGlobals[propertyName] = factory();
					} catch (error) {
						console.error("Accessibility helper failed to initialize: " + propertyName, error);
					}
				};

				safeInitAccessibility("accessibilityHelper", function () { return new AccessibilityHelper(); });
				safeInitAccessibility("accessibilityActionCalloutHelper", function () { return new AccessibilityActionCalloutHelper(); });
				safeInitAccessibility("accessibilityB1Helper", function () { return new AccessibilityB1Helper(GameGlobals.accessibilityHelper); });
				safeInitAccessibility("accessibilityB2Helper", function () { return new AccessibilityB2Helper(GameGlobals.accessibilityHelper); });
				safeInitAccessibility("accessibilityControlHelper", function () { return new AccessibilityControlHelper(); });
				safeInitAccessibility("accessibilityIndicatorHelper", function () { return new AccessibilityIndicatorHelper(); });
				safeInitAccessibility("accessibilityMapHelper", function () { return new AccessibilityMapHelper(GameGlobals.accessibilityHelper); });
				safeInitAccessibility("accessibilityMobileOverlayHelper", function () { return new AccessibilityMobileOverlayHelper(); });
				safeInitAccessibility("accessibilityNavigationHelper", function () { return new AccessibilityNavigationHelper(GameGlobals.accessibilityHelper); });
				safeInitAccessibility("accessibilityPopupHelper", function () { return new AccessibilityPopupHelper(); });
				safeInitAccessibility("accessibilityDialogueHelper", function () { return new AccessibilityDialogueHelper(); });
				safeInitAccessibility("accessibilityFightHelper", function () { return new AccessibilityFightHelper(GameGlobals.accessibilityHelper); });
				safeInitAccessibility("accessibilityProgressHelper", function () { return new AccessibilityProgressHelper(); });
				safeInitAccessibility("accessibilityCollapsibleHelper", function () { return new AccessibilityCollapsibleHelper(); });
				safeInitAccessibility("accessibilityStructureHelper", function () { return new AccessibilityStructureHelper(); });
				safeInitAccessibility("accessibilityTabStatusHelper", function () { return new AccessibilityTabStatusHelper(); });
				safeInitAccessibility("accessibilityTechTreeHelper", function () { return new AccessibilityTechTreeHelper(); });
				safeInitAccessibility("accessibilityFinalAuditHelper", function () { return new AccessibilityFinalAuditHelper(GameGlobals.accessibilityHelper); });

				let initScreenAccessibilityWhenReady = function () {
					if (GameGlobals.accessibilityScreenHelper) return;
					let tribeHelper = GameGlobals.tribeHelper;
					let upgradesReady = tribeHelper && tribeHelper.tribeUpgradesNodes && tribeHelper.tribeUpgradesNodes.head && tribeHelper.tribeUpgradesNodes.head.upgrades;
					if (upgradesReady) {
						safeInitAccessibility("accessibilityScreenHelper", function () { return new AccessibilityScreenHelper(); });
						return;
					}
					if (typeof window !== "undefined") window.setTimeout(initScreenAccessibilityWhenReady, 250);
				};
				initScreenAccessibilityWhenReady();
			}
		}
		
	};
	
	return GameGlobalsInitializer;
});
