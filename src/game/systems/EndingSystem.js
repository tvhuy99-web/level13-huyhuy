define([
	'ash',
	'game/GameGlobals',
	'game/GlobalSignals',
	'game/constants/GameConstants',
	'game/constants/UIConstants',
], function (Ash, GameGlobals, GlobalSignals, GameConstants, UIConstants) {
	
	var EndingSystem = Ash.System.extend({
		
		context: "EndingSystem",

		constructor: function () { },

		addToEngine: function (engine) {
			this.engine = engine;
			GlobalSignals.add(this, GlobalSignals.launchedSignal, this.onLaunched);
			GlobalSignals.add(this, GlobalSignals.gameStartedSignal, this.onGameStarted);
			GlobalSignals.add(this, GlobalSignals.gameEndedSignal, this.onGameFinished);
			GlobalSignals.add(this, GlobalSignals.popupClosedSignal, this.onPopupClosed);
			GlobalSignals.add(this, GlobalSignals.restartGameSignal, this.onRestart);
		},

		removeFromEngine: function (engine) {
			this.engine = null;
			GlobalSignals.removeAll(this);
		},
		
		showLaunch: function () {
			log.i("show launch", this);
			
			let duration = UIConstants.LAUNCH_FADEOUT_DURATION;
			let delay = UIConstants.THEME_TRANSITION_DURATION + 800;
			
			log.i("animate game-opacity-controlle opacity to 0", this);

			$(".game-opacity-controller").stop().animate({
				opacity: 0
			}, duration);
			
			setTimeout(function() {
				GameGlobals.gameState.isLaunchCompleted = true;
				GlobalSignals.launchCompletedSignal.dispatch();
			}, duration);
			
			setTimeout(function () {
				log.i("game finished", this);
				GameGlobals.gameState.isFinished = true;
				GlobalSignals.gameEndedSignal.dispatch();
			}, duration + delay);
		},
		
		showStoryPopup: function () {
			log.i("show story popup", this);
			
			let msg = "";
			let sys = this;
			
			msg += "<p>Con tàu Thuộc địa đã phóng thành công và hướng vào vũ trụ.</p>";
			msg += "<p>Hướng vào một bóng tối mới rộng lớn đến không tưởng.</p>";
			msg += "<p>Con tàu chật kín người. Chúng ta đã đưa theo được nhiều người nhất có thể. Sẽ còn những người khác nối bước. Bằng cách nào đó, chúng ta sẽ tìm được một mái nhà mới.</p>";
			
			GameGlobals.uiFunctions.showInfoPopup("Phóng tàu", msg, "Tiếp tục", null,
				function () {
					setTimeout(function () {
						sys.showMetaPopup();
					}, 500);
				}, true, false);
		},
		
		showMetaPopup: function () {
			log.i("show meta popup", this);

			this.isFinalPopupShown = true;
			
			let msg = "";
			
			msg += "<p>Chúc mừng! Bạn đã hoàn thành Level 13.</p>";
			msg += "<p><span class='p-meta'>Cảm ơn bạn đã chơi đến cuối. Nếu muốn chia sẻ cảm nghĩ hoặc phản hồi, bạn có thể dùng một trong các kênh sau:</span></p>";
			msg += "<p>" + GameConstants.getFeedbackLinksHTML() + "</p>";
			
			GameGlobals.uiFunctions.showQuestionPopup("Kết thúc", msg, "Chơi lại", "Thống kê",
				function () {
					GameGlobals.uiFunctions.restart();
				},
				function () {
					setTimeout(() => {
						GameGlobals.uiFunctions.showStatsPopup();
					}, 200);
				}
			);
		},
		
		resetShowLaunch: function () {
			let duration = 200;
			
			$(".game-opacity-controller").stop().animate({
				opacity: 1,
				scale: 1
			}, duration);
		},
		
		onLaunched: function () {
			var sys = this;
			setTimeout(function () {
				sys.showLaunch();
			}, 1);
		},
		
		onGameFinished: function () {
			var sys = this;
			setTimeout(function () {
				sys.showStoryPopup();
			}, 1);
		},

		onPopupClosed: function (id) {
			// re-show meta popup after any other popups such as the stats popup
			if (this.isFinalPopupShown && id != "common-popup") {
				this.showMetaPopup();
			}
		},
		
		onGameStarted: function () {
			if (GameGlobals.gameState.isFinished) {
				this.onGameFinished();
			}
		},

		onRestart: function (resetSave) {
			this.resetShowLaunch();
		},
		
	});

	return EndingSystem;
});
