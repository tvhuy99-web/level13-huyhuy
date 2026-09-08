define(['ash', 'text/Text', 'game/constants/TextConstants', 'game/constants/ItemConstants', 'game/constants/ItemConstants'], function (Ash, Text, TextConstants, ItemConstants, MovementConstants) {

	let LogConstants = {

		MSG_VISIBILITY_DEFAULT: "MSG_VISIBILITY_DEFAULT", // visible either outside in general or in a specific camp
		MGS_VISIBILITY_LEVEL: "MGS_VISIBILITY_LEVEL", // visible on same level as it happened both in and outside
		MSG_VISIBILITY_CAMP: "MSG_VISIBILITY_CAMP", // visible when in any camp
		MSG_VISIBILITY_GLOBAL: "MSG_VISIBILITY_GLOBAL", // visible everywhere

		MSG_VISIBILITY_DEFAULT_SHORT: "def",
		MGS_VISIBILITY_LEVEL_SHORT: "lvl",
		MSG_VISIBILITY_CAMP_SHORT: "camp",
		MSG_VISIBILITY_GLOBAL_SHORT: "g",

		// story
		MSG_ID_START: "START",

		// out actions
		MSG_ID_SCAVENGE: "SCAVENGE",
		MSG_ID_SCAVENGE_HEAP: "MSG_ID_SCAVENGE_HEAP",
		MSG_ID_SCOUT: "SCOUT",
		MSG_ID_SCOUT_FOUND_SOMETHING: "MSG_ID_SCOUT_FOUND_SOMETHING",
		MSG_ID_INVESTIGATE: "MSG_ID_INVESTIGATE",
		MSG_ID_USE_SPRING: "MSG_ID_USE_SPRING",
		MSG_ID_CLEAR_WASTE: "MSG_ID_CLEAR_WASTE",
		MSG_ID_CLEAR_DEBRIS: "MSG_ID_CLEAR_DEBRIS",
		MSG_ID_BRIDGED_GAP: "BRIDGED_GAP",
		MSG_ID_SCOUT_LOCALE: "SCOUT_LOCALE",
		MSG_ID_WORKSHOP_CLEARED: "WORKSHOP_CLEARED",
		MSG_ID_GANG_DEFEATED: "GANG_DEFEATED",
		MSG_ID_USE_COLLECTOR_FAIL: "USE_COLLECTOR_FAIL",
		MSG_ID_NAP: "MSG_ID_NAP",
		MSG_ID_WAIT: "MAS_ID_WAIT",

		// in actions
		MSG_ID_USE_CAMPFIRE_SUCC: "USE_CAMPFIRE_SUCC",
		MSG_ID_USE_CAMPFIRE_FAIL: "USE_CAMPFIRE_FAIL",
		MSG_ID_USE_LIBRARY: "MSG_ID_USE_LIBRARY",
		MSG_ID_USE_MARKET: "USE_MARKET",
		MSG_ID_USE_HOSPITAL: "USE_HOSPITAL",
		MSG_ID_USE_HOSPITAL2: "USE_HOSPITAL2",
		MSG_ID_USE_TEMPLE: "USE_TEMPLE",
		MSG_ID_USE_SHRINE: "USE_SHRINE",
		MSG_ID_BOUGHT_UPGRADE: "MSG_ID_BOUGHT_UPGRADE",
		MSG_ID_START_SEND_CAMP: "MSG_ID_START_SEND_CAMP",
		MSG_ID_FINISH_SEND_CAMP: "MSG_ID_FINISH_SEND_CAMP",
		MSG_ID_TRADE_WITH_CARAVAN: "MSG_ID_TRADE_WITH_CARAVAN",
		MSG_ID_RECRUIT: "MSG_ID_RECRUIT",

		// out atmospheric and results
		MSG_ID_ADD_HAZARD_PERK: "MSG_ID_ADD_HAZARD_PERK",
		MSG_ID_TIME_HAZARD_PERK: "MSG_ID_TIME_HAZARD_PERK",
		MSG_ID_REMOVE_HAZARD_PERK: "MSG_ID_REMOVE_HAZARD_PERK",
		MSG_ID_REMOVE_STAMINA_PERK: "MSG_ID_REMOVE_STAMINA_PERK",
		MSG_ID_FOUND_BLUEPRINT_FIRST: "MSG_ID_FOUND_BLUEPRINT_FIRST",
		MSG_ID_FOUND_BLUEPRINT_CONSECUTIVE: "MSG_ID_FOUND_BLUEPRINT_CONSECUTIVE",
		MSG_ID_FOUND_BLUEPRINT_LAST: "MSG_ID_FOUND_BLUEPRINT_LAST",
		MSG_ID_FOUND_ITEM_FIRST: "MSG_ID_FOUND_ITEM_FIRST",
		MSG_ID_LOST_ITEM: "MSG_ID_LOST_ITEM",
		MSG_ID_BROKE_ITEM: "MSG_ID_BROKE_ITEM",
		MSG_ID_LOST_EXPLORER: "MSG_ID_LOST_EXPLORER",
		MSG_ID_GOT_INJURED: "MSG_ID_GOT_INJURED",
		MSG_ID_FAINTED: "MSG_ID_FAINTED",
		MSG_ID_DESPAIR_AVAILABLE: "MSG_ID_DESPAIR_AVAILABLE",
		MSD_ID_MOVE_UNAVAILABLE: "MSD_ID_MOVE_UNAVAILABLE",
		MSG_ID_STAMINA_WARNING: "MSG_ID_STAMINA_WARNING",
		MSG_ID_VISION_RESET: "MSG_ID_VISION_RESET",
		MSG_ID_ENTER_OUTSKIRTS: "MSG_ID_ENTER_OUTSKIRTS",

		// in atmospheric and results
		MSG_ID_POPULATION_NATURAL: "POPULATION_NATURAL",
		MSG_ID_PLAYER_HUNGER: "MSG_ID_PLAYER_HUNGER",
		MSG_ID_AMBIENT_PLAYER: "MSG_ID_AMBIENT_PLAYER",
		MSG_ID_AMBIENT_CAMP: "MSG_ID_AMBIENT_CAMP",
		MSG_ID_CAMP_EVENT: "CAMP_EVENT",
		MSG_ID_BUILT_CAMP_LEVEL_POPULATION: "MSG_ID_BUILT_CAMP_LEVEL_POPULATION",
		MSG_ID_ENTER_LEVEL: "MSG_ID_ENTER_LEVEL",
		MSG_ID_REPUTATION_PENALTY_FOOD: "MSG_ID_REPUTATION_PENALTY_FOOD",
		MSG_ID_REPUTATION_PENALTY_WATER: "MSG_ID_REPUTATION_PENALTY_WATER",
		MSG_ID_REPUTATION_PENALTY_DEFENCES: "MSG_ID_REPUTATION_PENALTY_DEFENCES",
		MSG_ID_REPUTATION_PENALTY_HOUSING: "MSG_ID_REPUTATION_PENALTY_HOUSING",
		MDS_ID_EXPLORER_LEVEL_UP: "MDS_ID_EXPLORER_LEVEL_UP",

		// in buildings
		MSG_ID_BUILT_CAMP: "BUILT_CAMP",
		MSG_ID_BUILT_HOUSE: "BUILT_HOUSE",
		MSG_ID_BUILT_GENERATOR: "BUILT_GENERATOR",
		MSG_ID_BUILT_LIGHTS: "BUILT_LIGHTS",
		MSG_ID_BUILT_STORAGE: "BUILT_STORAGE",
		MSG_ID_BUILT_FORTIFICATION: "BUILT_FORTIFICATION",
		MSG_ID_BUILT_AQUEDUCT: "BUILT_AQUEDUCT",
		MSG_ID_BUILT_STABLE: "BUILT_STABLE",
		MSG_ID_BUILT_BARRACKS: "BUILT_BARRACKS",
		MSG_ID_BUILT_SMITHY: "BUILT_SMITHY",
		MSG_ID_BUILT_APOTHECARY: "BUILT_APOTHECARY",
		MSG_ID_BUILT_CEMENT_MILL: "BUILT_CEMENT_MILL",
		MSG_ID_BUILT_RADIO: "BUILT_RADIO",
		MSG_ID_BUILT_CAMPFIRE: "BUILT_CAMPFIRE",
		MSG_ID_BUILT_DARKFARM: "BUILT_DARKFARM",
		MSG_ID_BUILT_HOSPITAL: "BUILT_HOSPITAL",
		MSG_ID_BUILT_LIBRARY: "BUILT_LIBRARY",
		MSG_ID_BUILT_MARKET: "BUILT_MARKET",
		MSG_ID_BUILT_TRADING_POST: "BUILT_TRADING_POST",
		MSG_ID_BUILT_INN: "BUILT_INN",
		MSG_ID_BUILT_SQUARE: "MSG_ID_BUILT_SQUARE",
		MSG_ID_BUILT_GARDEN: "MSG_ID_BUILT_GARDEN",
		MSG_ID_BUILT_TEMPLE: "MSG_ID_BUILT_TEMPLE",
		MSG_ID_BUILT_SHRINE: "MSG_ID_BUILT_SHRINE",
		
		MSG_ID_IMPROVED_CAMPFIRE: "MSG_ID_IMPROVED_CAMPFIRE",
		MSG_ID_IMPROVED_LIBRARY: "MSG_ID_IMPROVED_LIBRARY",
		MSG_ID_IMPROVED_SQUARE: "MSG_ID_IMPROVED_SQUARE",
		MSG_ID_IMPROVED_GENERATOR: "MSG_ID_IMPROVED_GENERATOR",
		MSG_ID_IMPROVED_APOTHECARY: "MSG_ID_IMPROVED_APOTHECARY",
		MSG_ID_IMPROVED_SMITHY: "MSG_ID_IMPROVED_SMITHY",
		MSG_ID_IMPROVED_CEMENTMILL: "MSG_ID_IMPROVED_CEMENTMILL",
		MSG_ID_IMPROVED_MARKET: "MSG_ID_IMPROVED_MARKET",
		MSG_ID_IMPROVED_TEMPLE: "MSG_ID_IMPROVED_TEMPLE",

		// out buildings
		MSG_ID_BUILT_PASSAGE: "BUILT_PASSAGE",
		MSG_ID_BUILT_TRAP: "BUILT_TRAP",
		MSG_ID_BUILT_BUCKET: "BUILT_BUCKET",
		MSG_ID_BUILT_BEACON: "MSG_ID_BUILT_BEACON",
		MSG_ID_BUILT_SPACESHIP: "BUILT_SPACESHIP",

		// items
		MSG_ID_ADD_EXPLORER: "ADD_EXPLORER",
		MSG_ID_CRAFT_ITEM: "CRAFT_ITEM",
		MSG_ID_USE_FIRST_AID_KIT: "MSG_ID_USE_FIRST_AID_KIT",
		MSG_ID_USE_STAMINA_POTION: "MSG_ID_USE_STAMINA",
		MSG_ID_USE_SUPPLIES_CACHE: "MSG_ID_USE_SUPPLIES_CACHE",
		MSG_ID_USE_METAL_CACHE: "MSG_ID_USE_METAL_CACHE",
		MSG_ID_USE_BOOK: "MSG_ID_USE_BOOK",
		MSG_ID_USE_NEWSPAPER: "MSG_ID_USE_NEWSPAPER",
		MSG_ID_USE_SEED: "MSG_ID_USE_SEED",
		MSG_ID_USE_RESEARCHPAPER: "MSG_ID_USE_RESEARCHPAPER",
		MSG_ID_USE_MAP_PIECE: "MSG_ID_USE_MAP_PIECE",

		mergedMessages: [
			["SCAVENGE", "SCOUT", "SCOUT"],
		],

		ambientMessages: {
			"residential_ghosts": { 
				triggers: [ "locale_scouted" ],
				conditions: { sector: { sectorType: "residential" }, deity: false, numCamps: 2 },
				chance: 0.02,
				message: "Đột nhiên, sức nặng của tất cả những người từng sống và chết trong Thành phố đè lên bạn như một tấm chăn nặng nề"
			},
			"darkness_madness_01": {
				triggers: [ "action_any" ],
				conditions: { inCamp: false, sunlit: false, vision: [ -1, 50 ] },
				chance: 0.01,
				message: "Bóng tối xô lệch, vặn xoắn và áp sát hơn."
			},
			"ground_wonder_01": {
				triggers: [ "change_position" ],
				conditions: { sector: { ground: true }, sunlit: false },
				chance: 0.03,
				message: "Xung quanh bạn gần như luôn có tiếng sột soạt, dù bạn chẳng nhìn thấy gì."
			},
			"ground_wonder_02": {
				triggers: [ "change_position" ],
				conditions: { sector: { ground: true }, sunlit: true },
				chance: 0.03,
				message: "Không xa đây, vài con chim đang hót."
			},
			"story_rescue_prospector_missing_01": {
				triggers: [ "change_position" ],
				conditions: { inCamp: false, storyFlags: {  "RESCUE_EXPLORER_LEFT": true } },
				chance: 0.01,
				message: "Bạn tự hỏi liệu Sunita có cách nào vượt qua tầng 14 hay không."
			},
			"story_escape_need_to_find_passage_01": {
				triggers: [ "change_position" ],
				conditions: { inCamp: false, distanceToCamp: [ 2, -1 ], level: { nextPassageFound: false }, storyFlags: {  "ESCAPE_SEARCHING_FOR_GROUND": true } },
				chance: 0.01,
				message: "Bạn cần tìm lối đi xuống khỏi tầng này."
			},
			"story_apocalypse_need_tp_find_cause_01": {
				triggers: [ "change_position" ],
				conditions: { inCamp: false, distanceToCamp: [ 3, -1 ], storyFlags: {  "APOCALYPSE_KNOWN": false, "FALL_SEEN_STOREHOUSE": true } },
				chance: 0.01,
				message: "Bạn cần tìm hiểu Chính phủ đã chuẩn bị số vật tư khẩn cấp đó cho việc gì."
			},
			"story_apocalypse_need_tp_find_cause_01": {
				triggers: [ "change_position" ],
				conditions: { inCamp: false, distanceToCamp: [ 3, -1 ], storyFlags: {  "FALL_SEEN_SPACEFACTORY": true, "FALL_SEEN_EVACUATION": false } },
				chance: 0.01,
				message: "Bạn cần tìm hiểu con tàu vũ trụ kia được chế tạo để làm gì."
			},
			"story_apocalypse_need_to_find_solution_01": {
				triggers: [ "change_position" ],
				conditions: { inCamp: false, distanceToCamp: [ 3, -1 ], storyFlags: {  "APOCALYPSE_KNOWN": true, "APOCALYPSE_PLAN_READY": false } },
				chance: 0.01,
				message: "Bạn cần tìm cách ngăn những trận động đất."
			},
			"story_greenhouse_need_to_find_seeds_01": {
				triggers: [ "change_position" ],
				conditions: { inCamp: false, distanceToCamp: [ 2, -1 ], storyFlags: {  "GREENHOUSE_FOUND": true, "GREENHOUSE_RESTORED": false } },
				chance: 0.01,
				message: "Bạn cần tìm cách khôi phục các nhà kính."
			},
			"story_spirits_suspicion_01": {
				triggers: [ "change_position" ],
				conditions: { inCamp: false, distanceToCamp: [ 3, -1 ], deity: false, storyFlags: { numCamps: 2, "SPIRITS_MAGIC_SEEN": false } },
				chance: 0.01,
				message: "Bạn tự hỏi liệu Thành phố có thực sự tồn tại ma quỷ hay không."
			},
			"story_tribe_double_guess_escape_01": {
				triggers: [ "change_position" ],
				conditions: { inCamp: false, storyFlags: {  "ESCAPE_SEARCHING_FOR_GROUND": true } },
				chance: 0.01,
				message: "Bạn tự hỏi liệu mình có thể thuyết phục ai đó rời Thành phố cùng mình không."
			},
			"story_tribe_double_guess_escape_01": {
				triggers: [ "change_position" ],
				conditions: { inCamp: false, numCamps: 3, storyFlags: {  "ESCAPE_SEARCHING_FOR_GROUND": true } },
				chance: 0.005,
				message: "Bạn tự hỏi các trại sẽ phát triển thế nào sau khi bạn rời Thành phố."
			},
			"action_despair": {
				triggers: [ "action_any" ],
				conditions: { action: "despair" },
				chance: 0.5,
				visibility: "MSG_VISIBILITY_CAMP",
				messages: [ 
					"Giấc mơ của bạn đầy những nỗi lo mơ hồ.",
					"Bạn mơ thấy một sợi dây bật đứt và mình rơi xuống.",
					"Bạn mơ thấy nước dâng lên.",
					"Giấc mơ của bạn bị ám bởi những vụ nổ.",
					"Giấc mơ của bạn đầy bạo lực vô nghĩa.",
					"Trong mơ, Thành phố rung chuyển và sụp đổ như một ngôi nhà bằng lá.",
					"Trong mơ, Thành phố đầy những hồn ma tiếc nuối.",
					"Bạn mơ thấy những dòng người tị nạn.",
					"Bạn mơ thấy mình tan vào một đám đông đói khát và tuyệt vọng.",
					"Bạn mơ thấy những linh hồn cổ xưa nghẹn thở dưới sức nặng của Thành phố.",
					"Bạn mơ thấy mình cô độc, phơi bày trên Bề mặt, là người cuối cùng còn sống trong Thành phố.",
					"Bạn mơ thấy mình mắc kẹt trong mạng lưới, không thể trở về thế giới vật chất.",
				 ]
			},
			"action_move_sunlight": {
				triggers: [ "change_position" ],
				conditions: { inCamp: false, sunlit: true, vision: [ -1, 30 ] },
				chance: 0.1,
				message: "Khi mắt dần quen với ánh nắng, bạn thấy Thành phố trải dài trước mặt và cảm nhận sự nhỏ bé của mình."
			},
		},
		
		getUniqueID: function () {
			return "unique-" + Math.floor(Math.random() * 100000);
		},

		isUniqueID: function (id) {
			return id.indexOf("unique-") == 0;
		},

		cleanupMessage: function (s) {
			s = s.replaceAll("<br>", " ");
			s = s.replaceAll("<br/>", " ");
			return s;
		},

		getCooldown: function (id) {
			let seconds = 0;
			let minutes = 0;

			switch (id) {
				case LogConstants.MSG_ID_ENTER_OUTSKIRTS: minutes = 10; break;
				case LogConstants.MSG_ID_AMBIENT_PLAYER: minutes = 3; break;
				case LogConstants.MSG_ID_AMBIENT_CAMP: minutes = 10; break;
			}

			return (minutes * 60 + seconds) * 1000;
		},

		getMergedMsgID: function (messages) {
			var messageIDsToMatch = [];
			for (var m = 0; m < messages.length; m++) {
				if (messages[m].logsgID) {
					messageIDsToMatch = messageIDsToMatch.concat(messages[m].logMsgID.split("-"));
				}
			}

			var mergeIDs;
			var allMatch;
			var messageID;
			for (let i = 0; i < this.mergedMessages.length; i++) {
				mergeIDs = this.mergedMessages[i];
				if (mergeIDs.length > messageIDsToMatch.length) continue;
				allMatch = true;
				for (let j = 0; j < messageIDsToMatch.length; j++) {
					messageID = messageIDsToMatch[j];
					if (mergeIDs.indexOf(messageID) < 0) allMatch = false;
				}
				if (allMatch) {
					return mergeIDs.join("-");
				}
			}
			return null;
		},

		getLostItemMessage: function (resultVO) {
			let itemsTextVO = TextConstants.getItemsTextVO(resultVO.lostItems);

			let intros = [];
			switch (resultVO.action) {
				default:
					intros.push("Suýt rơi vào một khe nứt bất ngờ trên đường");
					intros.push("Rơi xuyên qua một sàn nhà mục nát");
					intros.push("Làm rơi vật phẩm khi trèo qua hàng rào");
					intros.push("Vấp phải những đường ống hư hỏng");
					intros.push("Để hở túi và vài vật phẩm rơi ra");
					intros.push("Hoảng sợ vì bóng tối rồi bỏ chạy, để lại vài vật phẩm");
					break;
			}

			let intro = intros[Math.floor(Math.random() * intros.length)];

			let fragments = [];

			fragments.push({ rawText: intro });
			fragments.push({ rawText: ". " });
			fragments.push({ rawText: "Đã mất " });
			fragments = fragments.concat(itemsTextVO.textFragments);
			
			return { textFragments: fragments };
		},

		getBrokeItemMessage: function (resultVO) {
			let itemsTextVO = TextConstants.getItemsTextVO(resultVO.brokenItems);

			let intros = [];
			switch (resultVO.action) {
				default:
					intros.push("Suýt rơi vào một khe nứt bất ngờ trên đường");
					intros.push("Rơi xuyên qua một sàn nhà mục nát");
					intros.push("Làm rơi vật phẩm khi trèo qua hàng rào");
					intros.push("Vấp phải những đường ống hư hỏng");
					intros.push("Ngã khi đang trèo");
					break;
			}

			let intro = intros[Math.floor(Math.random() * intros.length)];

			let fragments = [];

			fragments.push({ rawText: intro });
			fragments.push({ rawText: ". " });
			fragments.push({ rawText: "Đã làm hỏng " });
			fragments = fragments.concat(itemsTextVO.textFragments);
			
			return { textFragments: fragments };
		},

		getLostPerksMessage: function (resultVO) {
			return "Đã mất một bộ phận cấy ghép.";
		},

		getDespairMessage: function (despairType) {
			if (despairType == MovementConstants.DESPAIR_TYPE_THIRST) {
				// NOTE: thirst perk will trigger message
				return null;
			}
			if (despairType == MovementConstants.DESPAIR_TYPE_HUNGRER) {
				// NOTE: hunger perk will trigger message
				return null;
			}
			if (despairType == MovementConstants.DESPAIR_TYPE_STAMINA) {
				// NOTE: will be logged when not able to move anymore
				return null;
			}
			if (despairType == MovementConstants.DESPAIR_TYPE_MOVEMENT) {
				return "Không còn nơi nào để đi.";
			}

			return null;
		},

		getCantMoveMessage: function (despairType) {
			if (despairType == MovementConstants.DESPAIR_TYPE_STAMINA) {
				return "Quá mệt để tiếp tục.";
			}

			if (despairType == MovementConstants.DESPAIR_TYPE_THIRST) {
				return "Không thể đi xa hơn nếu thiếu nước.";
			}
			if (despairType == MovementConstants.DESPAIR_TYPE_HUNGRER) {
				return "Không thể đi xa hơn nếu thiếu thức ăn.";
			}

			return null;
		},

		getCraftItemMessage: function (itemVO) {
			var itemDetails = "";
			switch (itemVO.id) {
				case ItemConstants.itemDefinitions.light[0].id:
					itemDetails = " Ánh sáng sẽ giúp việc lục lọi an toàn hơn.";
					break;
			}
			let itemName = ItemConstants.getItemDisplayName(itemVO);
			return "Đã chế tạo " + itemName.toLowerCase() + "." + itemDetails;
		},

	}

	return LogConstants;

});
