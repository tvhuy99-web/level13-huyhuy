// Loader for the changelog.json
define(['ash', 'game/GameGlobals', 'game/GlobalSignals', 'game/constants/GameConstants'],
function (Ash, GameGlobals, GlobalSignals, GameConstants) {

	var ChangeLogHelper = Ash.Class.extend({
		
		loadingSuccesfull: undefined,
		versions: null,
		
		constructor: function () { },

		loadVersion: function () {
			var helper = this;
			$.getJSON('changelog.json', function (json) {
				helper.loadingSuccessful = true;
				helper.versions = json.versions;
				var version = helper.getCurrentVersionNumber();
				log.i("Loaded version: " + version);
				GlobalSignals.changelogLoadedSignal.dispatch(true);
				helper.displayVersionWarnings();
			})
			.fail(function (jqxhr, textStatus, error) {
				helper.loadingSuccessful = false;
				helper.versions = [];
				log.w("Failed to load version.");
				var err = "";
				if (jqxhr && jqxhr.status) err += "[" + jqxhr.status + "] ";
				err += textStatus;
				if (error) err += ", " + error;
				GlobalSignals.changelogLoadedSignal.dispatch(false);
				if (!GameConstants.isMobileOverlayShown) {
					helper.displayVersionWarnings();
				}
			});
		},
		
		displayVersionWarnings: function () {
			if (GameConstants.isDebugVersion) return;
			var currentVersion = this.getCurrentVersion();
			if (!currentVersion || !currentVersion.final) {
				GameGlobals.uiFunctions.showInfoPopup(
					"Cảnh báo",
					"Có vẻ bạn đang chơi một phiên bản Level 13 không được hỗ trợ.</br>Bạn có thể tiếp tục và tự chịu rủi ro, hoặc chơi phiên bản chính thức mới nhất <a href='" + GameConstants.gameURL + "'>tại đây</a>.",
					"Tiếp tục"
				);
			}
		},
		
		getCurrentVersionNumber: function () {
			var currentVersion = this.getCurrentVersion();
			if (currentVersion) {
				return this.getVersionNumber(currentVersion);
			}
			return "unknown";
		},
		
		getCurrentVersionDate: function () {
			var currentVersion = this.getCurrentVersion();
			if (currentVersion) {
				return currentVersion.final ? currentVersion.released : currentVersion.updated;
			}
			return "[no time stamp]";
		},
		
		getVersionNumber: function (version) {
			return version.version + " (" + version.phase + ")";
		},
		
		getCurrentVersion: function () {
			if (!this.versions) return null;
			
			var version = null;
			let i = 0;
			while (!version && i < this.versions.length) {
				if (this.versions[i].changes.length > 0) version = this.versions[i];
				i++;
			}
			return version;
		},
		
		getVersion: function (version) {
			for (let i = 0; i < this.versions.length; i++) {
				if (this.versions[i].version == version) {
					return this.versions[i];
				}
			}
			return null;
		},
		
		getVersionDigits: function (version) {
			var parts1 = version.split(" ");
			var parts2 = parts1[0].split(".");
			return { major: parts2[0], minor: parts2[1], patch: parts2[2] };
		},
		
		isUnsupportedVersion: function (version) {
			if (!version) return true;
			
			let currentVersionNumber = this.getCurrentVersionNumber();
			let currentVersionDetails = this.getCurrentVersion();
			let requiredVersion = currentVersionDetails && currentVersionDetails.requiredVersion || currentVersionNumber;
			let requiredVersionDigits = this.getVersionDigits(requiredVersion);
			let compareVersionDigits = this.getVersionDigits(version);
			
			log.i("isUnsupportedVersion? " + version + ", current: " + currentVersionNumber + ", required: " + requiredVersion);
			if (!requiredVersionDigits) return false;
			if (!compareVersionDigits) return false;
			return compareVersionDigits.major < requiredVersionDigits.major || compareVersionDigits.minor < requiredVersionDigits.minor || compareVersionDigits.patch < requiredVersionDigits.patch;
		},

		isOldVersion: function (version) {
			if (!version) return true;
			
			let currentVersion = this.getCurrentVersionNumber();
			let currentVersionDigits = this.getVersionDigits(currentVersion);
			let compareVersionDigits = this.getVersionDigits(version);
			
			if (!currentVersionDigits) return false;
			if (!compareVersionDigits) return false;
			return compareVersionDigits.major < currentVersionDigits.major || compareVersionDigits.minor < currentVersionDigits.minor || compareVersionDigits.patch < currentVersionDigits.patch;
		},

		hasPlayedOnUnsupportedVersion: function () {
			let playedVersions = GameGlobals.gameState.playedVersions;
			if (!playedVersions) return false;

			for (let i = 0; i < playedVersions.length; i++) {
				let version = playedVersions[i];
				if (this.isUnsupportedVersion(version)) return true;
			}

			return false;
		},
	
	});
	
	return ChangeLogHelper;
});
