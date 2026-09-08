define(['ash', 'game/vos/EnemyVO', 'game/constants/PerkConstants', 'text/Text'],
function (Ash, EnemyVO, PerkConstants, Text) {

	let EnemyConstants = {
		
		enemyDefinitions: [],

		enemyUsage: {}, // usage in current world, just for debug
		
		enemyTexts: {
			apparition: {
				nouns: [ "bóng ma", "thực thể" ],
				groupNouns: [ "đám mây", "nhóm", "đám tụ tập" ],
				verbsActive: [ "bị chiếm giữ bởi", "bị ám bởi"],
				verbsDefeated: [ "bị xua đuổi", "bị đánh bại", "đã được dọn sạch"],
			},
			bandit: {
				nouns: [ "kẻ cướp", "du côn" ],
				groupNouns: [ "đám đông", "băng nhóm"],
				verbsActive: [ "được tuần tra bởi", "bị kiểm soát bởi", "được canh giữ bởi", "bị chiếm giữ bởi"],
				verbsDefeated: [ "bị xua đuổi", "bị giết"],
			},
			big_animal: {
				nouns: [ "động vật hung dữ", "động vật hoang dã", "động vật", "sinh vật hoang dã thù địch" ],
				groupNouns: ["bầy", "đám đông", "băng nhóm"],
				verbsActive: ["tràn ngập bởi", "được canh giữ bởi", "bị chiếm giữ bởi"],
				verbsDefeated: ["đã được dọn sạch", "bị giết"],
			},
			bird: {
				nouns: ["sinh vật gây hại đô thị", "chim", "động vật", "động vật hung dữ", "sinh vật hoang dã thù địch" ],
				groupNouns: ["đàn", "bầy", "băng nhóm", "đám đông"],
				verbsActive: ["tràn ngập bởi", "bị xâm chiếm bởi", "bị chiếm giữ bởi", "được canh giữ bởi"],
				verbsDefeated: ["bị giết", "đã được dọn sạch", "bị xua đuổi"],
			},
			flora: {
				nouns: ["sinh vật gây hại đô thị", "cây dữ", "sinh vật hoang dã thù địch" ],
				groupNouns: [ "cụm", "nhóm", "bụi cây" ],
				verbsActive: ["bị xâm chiếm bởi", "bị bao phủ bởi", "tràn ngập bởi"],
				verbsDefeated: ["đã được dọn sạch"],
			},
			fungi: {
				nouns: ["sinh vật gây hại đô thị", "nấm nguy hiểm", "sinh vật hoang dã thù địch"],
				groupNouns: [ "cụm", "nhóm", "mảng sinh trưởng" ],
				verbsActive: ["bị xâm chiếm bởi", "bị bao phủ bởi", "tràn ngập bởi"],
				verbsDefeated: ["đã được dọn sạch", "bị giết"],
			},
			humanoid: {
				nouns: ["sinh vật hiểm ác"],
				groupNouns: ["đám đông", "băng nhóm", "nhóm"],
				verbsActive: ["được canh giữ bởi", "bị chiếm giữ bởi"],
				verbsDefeated: ["bị xua đuổi"],
			},
			robot: {
				nouns: ["robot hung dữ"],
				groupNouns: ["đám đông", "băng nhóm", "nhóm", "bầy", "tổ"],
				verbsActive: ["được tuần tra bởi", "bị kiểm soát bởi", "được canh giữ bởi", "bị chiếm giữ bởi"],
				verbsDefeated: ["bị vô hiệu hóa", "đã được dọn sạch", "bị phá hủy"],
			},
			small_animal: {
				nouns: ["sinh vật gây hại đô thị", "động vật hung dữ", "động vật hoang dã", "động vật", "sinh vật hoang dã thù địch"],
				groupNouns: ["bầy", "đàn", "đám đông", "nhóm", "đạo quân"],
				verbsActive: ["bị xâm chiếm bởi", "tràn ngập bởi" ],
				verbsDefeated: ["bị giết", "đã được dọn sạch"],
			},
			structure: {
				nouns: ["công trình tự động"],
				groupNouns: ["nhóm", "tập hợp"],
				verbsActive: ["bị chặn bởi"],
				verbsDefeated: ["bị vô hiệu hóa"],
			},
		},

		enemyNameTranslations: {
			"albatross": "chim hải âu",
			"albino salamander": "kỳ giông bạch tạng",
			"deformed albino salamander": "kỳ giông bạch tạng biến dạng",
			"ferocious albino salamander": "kỳ giông bạch tạng hung dữ",
			"giant albino salamander": "kỳ giông bạch tạng khổng lồ",
			"lesser albino salamander": "kỳ giông bạch tạng nhỏ",
			"blue alley hemlock": "độc cần hẻm xanh",
			"red alley hemlock": "độc cần hẻm đỏ",
			"wilted alley hemlock": "độc cần hẻm héo úa",
			"alligator": "cá sấu",
			"aggressive alligator": "cá sấu hung hãn",
			"mutant alligator": "cá sấu đột biến",
			"pale alligator": "cá sấu nhợt màu",
			"bold bandit": "kẻ cướp gan lì",
			"fur-clad bandit": "kẻ cướp mặc áo lông",
			"homeless bandit": "kẻ cướp vô gia cư",
			"hungry bandit": "kẻ cướp đói khát",
			"masked bandit": "kẻ cướp đeo mặt nạ",
			"seasoned bandit": "kẻ cướp dày dạn",
			"sunburnt bandit": "kẻ cướp cháy nắng",
			"tanned bandit": "kẻ cướp rám nắng",
			"berserk": "kẻ cuồng nộ",
			"black bear": "gấu đen",
			"small black bear": "gấu đen nhỏ",
			"bloodwort": "cây bloodwort",
			"camel spider": "nhện lạc đà",
			"carpet viper": "rắn lục thảm",
			"agitated cat": "mèo kích động",
			"ferocious cat": "mèo hung dữ",
			"agitated cave bat": "dơi hang kích động",
			"big cave bat": "dơi hang lớn",
			"deformed cave bat": "dơi hang biến dạng",
			"huge cave bat": "dơi hang khổng lồ",
			"small cave bat": "dơi hang nhỏ",
			"cave bat": "dơi hang",
			"giant centipede": "rết khổng lồ",
			"poisonous centipede": "rết độc",
			"radioactive centipede": "rết phóng xạ",
			"noxious cloud": "đám mây độc hại",
			"pestilent cloud": "đám mây gây dịch",
			"cloud of pollen": "đám mây phấn hoa",
			"cockroach": "gián",
			"radioactive cockroach": "gián phóng xạ",
			"condor": "kền kền",
			"constrictor vine": "dây leo siết mồi",
			"death adder": "rắn tử thần",
			"deathfly": "ruồi tử thần",
			"gleaming delivery bot": "robot giao hàng sáng bóng",
			"hacked delivery bot": "robot giao hàng bị hack",
			"rugged delivery bot": "robot giao hàng bền bỉ",
			"stray delivery bot": "robot giao hàng thất lạc",
			"devil's fingers": "ngón tay quỷ",
			"dire boar": "lợn rừng hung dữ",
			"diseased slime": "dịch nhầy bệnh hoạn",
			"mutant dog": "chó đột biến",
			"rabid dog": "chó dại",
			"towering mutant dog": "chó đột biến khổng lồ",
			"wild dog": "chó hoang",
			"doomsayer": "kẻ tận thế",
			"drone from a forgotten war": "máy bay không người lái từ cuộc chiến bị lãng quên",
			"drove of boars": "đàn lợn rừng",
			"mad dryad": "dryad điên loạn",
			"vengeful dryad": "dryad báo thù",
			"duskboar": "lợn hoàng hôn",
			"dwarf duskboar": "lợn hoàng hôn lùn",
			"drain eel": "lươn cống",
			"electric eel": "lươn điện",
			"escaped lab chimpanzee": "tinh tinh phòng thí nghiệm trốn thoát",
			"escaped lab monkey": "khỉ phòng thí nghiệm trốn thoát",
			"escaped pet boa": "trăn nuôi trốn thoát",
			"fiend": "quỷ dữ",
			"fierce snake": "rắn hung dữ",
			"antagonistic fire door": "cửa chống cháy thù địch",
			"malfunctioning fire door": "cửa chống cháy hỏng",
			"fire salamander": "kỳ giông lửa",
			"lesser fire salamander": "kỳ giông lửa nhỏ",
			"flying fox": "cáo bay",
			"horned flying fox": "cáo bay có sừng",
			"armed gangster": "xã hội đen có vũ trang",
			"gangster": "xã hội đen",
			"desperate gangster": "xã hội đen tuyệt vọng",
			"old garbage robot": "robot rác cũ",
			"streamlined garbage robot": "robot rác thuôn gọn",
			"tattered garbage robot": "robot rác tả tơi",
			"guard ghost": "hồn ma canh gác",
			"half-remembered ghost": "hồn ma ký ức mơ hồ",
			"sorrowful ghost": "hồn ma đau buồn",
			"remorseful ghost": "hồn ma hối tiếc",
			"vengeful ghost": "hồn ma báo thù",
			"ghost bat": "dơi ma",
			"ghoul": "quỷ ăn xác",
			"giant snow owl": "cú tuyết khổng lồ",
			"red giant stagshorn": "nấm sừng hươu khổng lồ đỏ",
			"yellow giant stagshorn": "nấm sừng hươu khổng lồ vàng",
			"glowing mushroom": "nấm phát sáng",
			"goliath frog": "ếch goliath",
			"goshawk": "diều hâu",
			"great black pelican": "bồ nông đen lớn",
			"grey adder": "rắn hổ xám",
			"grizzly bear": "gấu xám",
			"a colony of seagulls": "đàn mòng biển",
			"advanced guard bot": "robot canh gác cao cấp",
			"aggressive guard bot": "robot canh gác hung hãn",
			"ancient guard bot": "robot canh gác cổ đại",
			"enormous guard bot": "robot canh gác khổng lồ",
			"erratic guard bot": "robot canh gác thất thường",
			"factory guard bot": "robot canh gác nhà máy",
			"modified guard bot": "robot canh gác cải tiến",
			"radiation-resistant guard bot": "robot canh gác chống phóng xạ",
			"reinforced guard bot": "robot canh gác gia cố",
			"rusted guard bot": "robot canh gác rỉ sét",
			"slow guard bot": "robot canh gác chậm chạp",
			"corroded guard bot": "robot canh gác ăn mòn",
			"pollution-resistant guard bot": "robot canh gác chống ô nhiễm",
			"harvester bot": "robot thu hoạch",
			"hawk": "diều hâu",
			"black hyena": "linh cẩu đen",
			"mutant hyena": "linh cẩu đột biến",
			"spotted hyena": "linh cẩu đốm",
			"dogged industrial robot": "robot công nghiệp lì lợm",
			"hardy industrial robot": "robot công nghiệp bền bỉ",
			"neglected industrial robot": "robot công nghiệp bị bỏ mặc",
			"stranded industrial robot": "robot công nghiệp mắc kẹt",
			"tangled industrial robot": "robot công nghiệp rối dây",
			"industrial robot": "robot công nghiệp",
			"leaking gas pipe": "ống khí gas rò rỉ",
			"mumbling lunatic": "kẻ điên lẩm bẩm",
			"aggressive magpie": "chim ác là hung dữ",
			"territorial magpie": "chim ác là giữ lãnh thổ",
			"disoriented maintenance bot": "robot bảo trì mất phương hướng",
			"overzealous maintenance bot": "robot bảo trì quá cuồng nhiệt",
			"military bot": "robot quân sự",
			"advanced military bot": "robot quân sự cao cấp",
			"mountain lion": "sư tử núi",
			"mugger": "kẻ trấn lột",
			"threatening mugger": "kẻ trấn lột đe dọa",
			"delirious outlaw": "kẻ ngoài vòng pháp luật mê sảng",
			"enigmatic outlaw": "kẻ ngoài vòng pháp luật bí ẩn",
			"malnourished outlaw": "kẻ ngoài vòng pháp luật suy dinh dưỡng",
			"solitary outlaw": "kẻ ngoài vòng pháp luật cô độc",
			"outlaw": "kẻ ngoài vòng pháp luật",
			"wild outlaw": "kẻ ngoài vòng pháp luật hoang dã",
			"overgrown nettle": "cây tầm ma um tùm",
			"menacing poison vine": "dây leo độc đáng sợ",
			"overgrown poison vine": "dây leo độc um tùm",
			"rampant poison vine": "dây leo độc lan tràn",
			"porcupine": "nhím",
			"aggressive raccoon": "gấu mèo hung dữ",
			"alarmed raccoon": "gấu mèo hoảng sợ",
			"mutant raccoon": "gấu mèo đột biến",
			"black radiothropic fungi": "nấm phóng xạ đen",
			"brown radiothropic fungi": "nấm phóng xạ nâu",
			"purple radiothropic fungi": "nấm phóng xạ tím",
			"spiky radiothropic fungi": "nấm phóng xạ gai góc",
			"yellow radiothropic fungi": "nấm phóng xạ vàng",
			"giant rat": "chuột khổng lồ",
			"huge rat": "chuột cực lớn",
			"mutant rat": "chuột đột biến",
			"ratsnake": "rắn chuột",
			"white ratsnake": "rắn chuột trắng",
			"yellow ratsnake": "rắn chuột vàng",
			"robber": "tên cướp",
			"mean robber": "tên cướp dữ tợn",
			"nervous robber": "tên cướp lo lắng",
			"robot from a forgotten war": "robot từ cuộc chiến bị lãng quên",
			"aggressive robotic dog": "chó robot hung dữ",
			"big robotic dog": "chó robot lớn",
			"small robotic dog": "chó robot nhỏ",
			"fire scorpion": "bọ cạp lửa",
			"giant scorpion": "bọ cạp khổng lồ",
			"night scorpion": "bọ cạp đêm",
			"scout bot": "robot trinh sát",
			"advanced scout bot": "robot trinh sát cao cấp",
			"primitive scout bot": "robot trinh sát thô sơ",
			"advanced security bot": "robot an ninh cao cấp",
			"security bot": "robot an ninh",
			"sewer varanid": "thằn lằn cống",
			"deformed sewer varanid": "thằn lằn cống biến dạng",
			"hulking sewer varanid": "thằn lằn cống khổng lồ",
			"territorial sewer varanid": "thằn lằn cống giữ lãnh thổ",
			"predatory sewer varanid": "thằn lằn cống săn mồi",
			"resentful shadow": "bóng đen oán hận",
			"wailing shadow": "bóng đen than khóc",
			"sharp memory": "ký ức sắc bén",
			"skunk": "chồn hôi",
			"black slug": "sên đen",
			"giant slug": "sên khổng lồ",
			"green slug": "sên xanh",
			"grey slug": "sên xám",
			"purple slug": "sên tím",
			"red slug": "sên đỏ",
			"gigantic spider": "nhện khổng lồ",
			"mutant spider": "nhện đột biến",
			"poisonous spider": "nhện độc",
			"toxic spider": "nhện nhiễm độc",
			"stinkhorn": "nấm sừng hôi",
			"glowing stinkhorn": "nấm sừng hôi phát sáng",
			"suspicious moss": "rêu đáng ngờ",
			"swarm of pidgeons": "đàn bồ câu",
			"tarantula": "nhện tarantula",
			"white tarantula": "nhện tarantula trắng",
			"rat tenrec": "tenrec chuột",
			"common tenrec": "tenrec thường",
			"elephant tenrec": "tenrec voi",
			"tentacle sundew": "cây gọng vó xúc tu",
			"feral sundew": "cây gọng vó hoang dã",
			"queen sundew": "cây gọng vó nữ hoàng",
			"rose sundew": "cây gọng vó hồng",
			"slum sundew": "cây gọng vó khu ổ chuột",
			"thorny bush": "bụi gai",
			"thug": "du côn",
			"shivering thug": "du côn run rẩy",
			"tiger snake": "rắn hổ",
			"nasty trap": "bẫy hiểm",
			"rickety trap": "bẫy ọp ẹp",
			"rusty trap": "bẫy rỉ sét",
			"spiky trap": "bẫy gai",
			"big turret": "tháp pháo lớn",
			"turret from a lost gang": "tháp pháo của băng nhóm đã mất",
			"turret guarding a forgotten border": "tháp pháo canh biên giới bị lãng quên",
			"small turret": "tháp pháo nhỏ",
			"vampire bat": "dơi ma cà rồng",
			"great vampire bat": "dơi ma cà rồng lớn",
			"wasp nest": "tổ ong bắp cày",
			"wolf": "sói",
			"wolly monkey": "khỉ len",
			"escaped zoo panther": "báo đen sở thú trốn thoát",
			"injured zoo panther": "báo đen sở thú bị thương",
		},

		getEnemyDisplayName: function (enemy) {
			if (!enemy) return "";
			if (Text.currentLanguage != "VI_VN") return enemy.name;
			return this.enemyNameTranslations[enemy.name.toLowerCase()] || "sinh vật nguy hiểm";
		},
		
		enemyLoot: {
			apparition: {
				droppedResources: [ "water" ],
			},
			bandit: {
				droppedResources: [ "food", "water", "rope" ],
				droppedIngredients: [ "res_bands", "res_bottle", "res_hairpin", "res_leather", "res_silk", "res_tape" ],
			},
			big_animal: {
				droppedResources: [ "food" ],
				droppedIngredients: [ "res_bands", "res_leather" ],
			},
			bird: {
				droppedResources: [ "food" ],
				droppedIngredients: [ "res_bands", "res_bottle", "res_hairpin", "res_leather", "res_tape" ],
			},
			flora: {
				droppedResources: [ "food" ],
				droppedIngredients: [ "res_glowbug", "res_silk" ],
			},
			fungi: {
				droppedResources: [ "food" ],
				droppedIngredients: [ "res_bottle", "res_glowbug", "res_silk" ],
			},
			humanoid: {
				droppedResources: [ "water" ],
				droppedIngredients: [ "res_bands", "res_bottle", "res_hairpin", "res_leather", "res_silk", "res_tape" ],
			},
			robot: {
				droppedResources: [ "metal", "fuel" ],
				droppedIngredients: [ "res_bands", "res_bottle", "res_hairpin", "res_tape" ],
			},
			small_animal: {
				droppedResources: [ "food" ],
				droppedIngredients: [ "res_bands", "res_glowbug", "res_hairpin", "res_leather", "res_silk" ],
			},
			structure: {
				droppedResources: [ "metal" ],
				droppedIngredients: [ "res_bands", "res_bottle", "res_glowbug", "res_hairpin", "res_tape" ],
			},
		},
		
		enemyInjuries: {
			bandit: [ PerkConstants.injuryType.SHARP, PerkConstants.injuryType.BLUNT ],
			big_animal: [ PerkConstants.injuryType.SHARP, PerkConstants.injuryType.BLUNT ],
			bird: [ PerkConstants.injuryType.SHARP ],
			flora: [ PerkConstants.injuryType.BLUNT ],
			fungi: [ PerkConstants.injuryType.BLUNT ],
			humanoid: [ PerkConstants.injuryType.SHARP, PerkConstants.injuryType.BLUNT ],
			robot: [ PerkConstants.injuryType.SHARP, PerkConstants.injuryType.BLUNT ],
			small_animal: [ PerkConstants.injuryType.SHARP ],
			structure: [ PerkConstants.injuryType.BLUNT ],
		},
		
		// saved for convenience & startup speed
		enemyDifficulties: {},
		
		getEnemy: function (enemyID) {
			let enemyVO = this.tryGetEnemy(enemyID);
			if (enemyVO) return enemyVO;
			log.w("no such enemy found: " + enemyID);
			return null;
		},

		tryGetEnemy: function (enemyID) {
			for (let i in this.enemyDefinitions) {
				let enemy = this.enemyDefinitions[i];
				if (enemy.id == enemyID) {
					return enemy;
				}
			}
			return null;
		},
		
		getAll: function () {
			let result = [];
			for (let i in this.enemyDefinitions) {
				let enemy = this.enemyDefinitions[i];
				result.push(enemy);
			}
			return result;
		},
		
		getDifficulty: function (enemy) {
			return this.enemyDifficulties[enemy.id];
		},

		getDropsCurrency: function (enemyVO) {
			switch (enemyVO.enemyClass) {
				case "bandit": return true;
				default: return false;
			}
		}
		
	};
		
	
	return EnemyConstants;
	
});
