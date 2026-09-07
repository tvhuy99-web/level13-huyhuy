define([
	'text/TextLoader',
	'game/GameGlobals',
	'game/GameState',
	'game/GameFlowLogger',
	'game/MetaState',
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
	GameState,
	GameFlowLogger,
	MetaState,
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
	var GameGlobalsInitializer = {
		
		init: function (engine) {
			GameGlobals.engine = engine;
			GameGlobals.gameState = new GameState();
			GameGlobals.metaState = new MetaState();
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
				GameGlobals.uiFunctions = new UIFunctions();
				GameGlobals.campVisHelper = new CampVisHelper();
			}

			GameGlobals.accessibilityHelper = new AccessibilityHelper();
			GameGlobals.accessibilityActionCalloutHelper = new AccessibilityActionCalloutHelper();
			GameGlobals.accessibilityB1Helper = new AccessibilityB1Helper(GameGlobals.accessibilityHelper);
			GameGlobals.accessibilityB2Helper = new AccessibilityB2Helper(GameGlobals.accessibilityHelper);
			GameGlobals.accessibilityControlHelper = new AccessibilityControlHelper();
			GameGlobals.accessibilityIndicatorHelper = new AccessibilityIndicatorHelper();
			GameGlobals.accessibilityMapHelper = new AccessibilityMapHelper(GameGlobals.accessibilityHelper);
			GameGlobals.accessibilityMobileOverlayHelper = new AccessibilityMobileOverlayHelper();
			GameGlobals.accessibilityNavigationHelper = new AccessibilityNavigationHelper(GameGlobals.accessibilityHelper);
			GameGlobals.accessibilityPopupHelper = new AccessibilityPopupHelper();
			GameGlobals.accessibilityDialogueHelper = new AccessibilityDialogueHelper();
			GameGlobals.accessibilityFightHelper = new AccessibilityFightHelper(GameGlobals.accessibilityHelper);
			GameGlobals.accessibilityProgressHelper = new AccessibilityProgressHelper();
			GameGlobals.accessibilityCollapsibleHelper = new AccessibilityCollapsibleHelper();
			GameGlobals.accessibilityScreenHelper = new AccessibilityScreenHelper();
			GameGlobals.accessibilityStructureHelper = new AccessibilityStructureHelper();
			GameGlobals.accessibilityTabStatusHelper = new AccessibilityTabStatusHelper();
			GameGlobals.accessibilityTechTreeHelper = new AccessibilityTechTreeHelper();
			GameGlobals.accessibilityFinalAuditHelper = new AccessibilityFinalAuditHelper(GameGlobals.accessibilityHelper);
		}
		
	};
	
	return GameGlobalsInitializer;
});
