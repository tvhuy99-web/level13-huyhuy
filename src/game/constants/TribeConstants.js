define(['ash', 'game/constants/OccurrenceConstants', 'game/constants/UIConstants'], function (Ash, OccurrenceConstants, UIConstants) {
	
	let TribeConstants = {
		
		milestones: [
			{
				name: "trại cô độc",
				description: "Nơi trú ẩn của vài người sống sót với rất ít tài sản",
				maxRumours: 100,
				maxEvidence: 100,
				maxHope: 0,
				maxInsight: 0,
				baseReputation: 0,
			},
			{
				name: "khu định cư nhỏ",
				description: "Một nơi an toàn được vài người gọi là nhà và bắt đầu tích lũy tài nguyên",
				maxRumours: 500,
				maxEvidence: 500,
				maxHope: 1,
				maxInsight: 0,
				baseReputation: 1,
				unlockedEvents: [ OccurrenceConstants.campOccurrenceTypes.raid ],
			},
			{
				name: "cộng đồng đa tầng",
				description: "Khởi đầu của một cộng đồng trải rộng qua nhiều tầng",
				maxRumours: 800,
				maxEvidence: 500,
				maxHope: 10,
				maxInsight: 0,
				baseReputation: 2,
			},
			{
				name: "bộ lạc hưng thịnh",
				description: "Đủ đông để được gọi là một bộ lạc",
				maxRumours: 2000,
				maxEvidence: 1000,
				maxHope: 100,
				maxInsight: 0,
				baseReputation: 3,
			},
			{
				name: "thành phố trong Thành phố",
				description: "Một xã hội có tổ chức, lao động chuyên môn hóa và nguồn sản xuất lương thực ổn định",
				maxRumours: 3000,
				maxEvidence: 1500,
				maxHope: 300,
				maxInsight: 0,
				baseReputation: 4,
				unlockedFeatures: [ UIConstants.UNLOCKABLE_FEATURE_WORKER_AUTO_ASSIGNMENT ],
			},
			{
				name: "xã hội đa tầng",
				description: "Một bộ lạc trải rộng qua nhiều tầng",
				maxRumours: 8000,
				maxEvidence: 2000,
				maxHope: 600,
				maxInsight: 100,
				baseReputation: 5,
			},
			{
				name: "nhà nước hùng mạnh",
				description: "Một xã hội đã chứng minh có thể không chỉ sinh tồn mà còn phát triển",
				maxRumours: 15000,
				maxEvidence: 3000,
				maxHope: 1000,
				maxInsight: 200,
				baseReputation: 6,
			},
			{
				name: "nền văn minh tái thiết",
				description: "Một nền văn minh mới sinh ra từ đống đổ nát của nền văn minh cũ",
				maxRumours: 20000,
				maxEvidence: 4000,
				maxHope: 1500,
				maxInsight: 500,
				baseReputation: 8,
			},
		],
		
		luxuryType: {
			// consumable
			CHOCOLATE: "CHOCOLATE",
			COFFEE: "COFFEE",
			HONEY: "HONEY",
			OLIVES: "OLIVES",
			SALT: "SALT",
			SPICES: "SPICES",
			TEA: "TEA",
			TOBACCO: "TOBACCO",
			TRUFFLES: "TRUFFLES",
			// materials
			AMBER: "AMBER",
			DIAMONDS: "DIAMONDS",
			EMERALDS: "EMERALDS",
			GOLD: "GOLD",
			IVORY: "IVORY",
			JADE: "JADE",
			PEARLS: "PEARLS",
			SILVER: "SILVER",
		},
		
		possibleLuxuriesByCampOrdinal: [
			{ campOrdinal: 3, possibleLuxuries: [ "CHOCOLATE", "COFFEE", "TEA", "DIAMONDS", "JADE" ] },
			{ campOrdinal: 6, possibleLuxuries: [ "COFFEE", "SALT", "TEA", "AMBER", "GOLD", "JADE", "SILVER", "EMERALDS" ] },
			{ campOrdinal: 8, possibleLuxuries: [ "COFFEE", "HONEY", "TRUFFLES", "OLIVES", "SALT", "AMBER", "PEARLS" ] },
			{ campOrdinal: 10, possibleLuxuries: [ "CHOCOLATE", "COFFEE", "SPICES", "TOBACCO", "DIAMONDS", "EMERALDS", "GOLD", "SILVER" ] },
			{ campOrdinal: 13, possibleLuxuries: [ "CHOCOLATE", "COFFEE", "IVORY", "TOBACCO" ] },
			{ campOrdinal: 15, possibleLuxuries: [ "CHOCOLATE", "COFFEE", "HONEY", "OLIVES", "IVORY", "PEARLS", "SPICES" ] },
		],
		
		init: function () {
			for (let i = 0; i < this.milestones.length; i++) {
				this.milestones[i].index = i;
			}
		},
		
		getMilestone: function (i) {
			let milestone = this.milestones[i] || {};
			milestone.index = i;
			return milestone;
		},
		
		getPreviousMilestone: function (milestone) {
			let previousIndex = milestone.index - 1;
			if (previousIndex < 0) return null;
			return this.milestones[previousIndex];
		},
		
		getNextMilestone: function (milestone) {
			let nextIndex = milestone.index + 1;
			if (nextIndex >= this.milestones.length) return null;
			return this.milestones[nextIndex];
		},
		
		getPossibleLuxuriesByCampOrdinal: function (campOrdinal) {
			for (let i = 0; i < this.possibleLuxuriesByCampOrdinal.length; i++) {
				let entry = this.possibleLuxuriesByCampOrdinal[i];
				if (entry.campOrdinal == campOrdinal) {
					return entry.possibleLuxuries;
				}
			}
			return [];
		},
		
		getMaxNumAvailableLuxuryResources: function (campOrdinal) {
			let result = 0;
			for (let i = 0; i < this.possibleLuxuriesByCampOrdinal.length; i++) {
				let entry = this.possibleLuxuriesByCampOrdinal[i];
				if (entry.campOrdinal <= campOrdinal) {
					result++;
				}
			}
			return result;
		},
		
		getLuxuryDisplayName: function (luxuryType) {
			switch (luxuryType) {
				case TribeConstants.luxuryType.HONEY: return "mật ong";
				case TribeConstants.luxuryType.OLIVES: return "ô liu";
				case TribeConstants.luxuryType.TRUFFLES: return "nấm cục";
				case TribeConstants.luxuryType.CHOCOLATE: return "sô-cô-la";
				case TribeConstants.luxuryType.COFFEE: return "cà phê";
				case TribeConstants.luxuryType.SPICES: return "gia vị";
				case TribeConstants.luxuryType.TOBACCO: return "thuốc lá";
				case TribeConstants.luxuryType.TEA: return "trà";
				case TribeConstants.luxuryType.AMBER: return "hổ phách";
				case TribeConstants.luxuryType.PEARLS: return "ngọc trai";
				case TribeConstants.luxuryType.IVORY: return "ngà voi";
				case TribeConstants.luxuryType.SALT: return "muối";
				case TribeConstants.luxuryType.DIAMONDS: return "kim cương";
				case TribeConstants.luxuryType.EMERALDS: return "ngọc lục bảo";
				case TribeConstants.luxuryType.GOLD: return "vàng";
				case TribeConstants.luxuryType.JADE: return "ngọc bích";
				case TribeConstants.luxuryType.SILVER: return "bạc";
				
				default:
					log.w("unknown luxury resource type: " + luxuryType);
					return luxuryType;
			}
		},
		
	};
	
	TribeConstants.init();
	
	return TribeConstants;
	
});
