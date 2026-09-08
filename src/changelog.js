
var versions;

var summaryTranslations = {
	"Refactor world generation to be faster and more backwards compatible": "Tái cấu trúc việc tạo thế giới để tăng tốc độ và tương thích ngược",
	"Add more story flavour to story generation (sector features, level features, districts)": "Bổ sung chiều sâu cốt truyện cho quá trình tạo truyện (đặc điểm khu vực, đặc điểm tầng, quận)",
	"Improve level structure generation": "Cải thiện cách tạo cấu trúc tầng",
	"Add small differences to camps to make each camp unique": "Bổ sung khác biệt nhỏ giữa các trại để mỗi trại có nét riêng",
	"Bugfixes and text polish": "Sửa lỗi và trau chuốt câu chữ",
	"Small balancing adjustments (building repair costs, damaged building reputation penalty, disease frequency)": "Điều chỉnh cân bằng nhỏ (chi phí sửa công trình, phạt danh tiếng khi công trình hư hại, tần suất dịch bệnh)",
	"Better visitor and error tracking and a note in the FAQ about what is being tracked": "Theo dõi khách ghé thăm và lỗi tốt hơn, đồng thời bổ sung ghi chú trong FAQ về dữ liệu được theo dõi",
	"Balancing adjustements to upgrade costs (rumours) and hazard values (when certain equipment is expected)": "Điều chỉnh cân bằng chi phí nâng cấp (tin đồn) và giá trị hiểm họa (khi dự kiến cần một số trang bị)",
	"Add a few more dialogues for variety and hints": "Bổ sung thêm vài đoạn hội thoại để đa dạng và gợi ý",
	"Add a list of active outgoing trade caravans to the trade tab": "Bổ sung danh sách các đoàn xe giao thương đang hoạt động vào tab giao thương",
	"Add story and dialogue systems along with initial story structure and lots of dialogues": "Thêm hệ thống cốt truyện và hội thoại, cùng cấu trúc truyện ban đầu và nhiều đoạn hội thoại",
	"Add NPCs in camp and outside": "Bổ sung NPC trong và ngoài trại",
	"Add new explorer abilities": "Thêm khả năng mới cho người thám hiểm",
	"Add explorer injuries": "Thêm thương tích cho người thám hiểm",
	"Improve explorer generation": "Cải thiện việc tạo người thám hiểm",
	"Make explorers sometimes improve their abilities": "Cho phép người thám hiểm đôi khi cải thiện năng lực",
	"Ensure certain explorers (including dogs) never leave unless dismissed": "Đảm bảo một số người thám hiểm (bao gồm cả chó) không rời đi trừ khi bị cho thôi",
	"Add new movement blockers and hazards (flooding, old explosives, gang territroy, toll gates)": "Bổ sung vật cản di chuyển và hiểm họa mới (ngập lụt, chất nổ cũ, lãnh địa băng nhóm, trạm thu phí)",
	"Add several new camp events (disease, earthquake, accident, refugees, visitor)": "Thêm một số sự kiện trại mới (dịch bệnh, động đất, tai nạn, người tị nạn, khách ghé thăm)",
	"Add examine spots with a little lore in some sectors": "Thêm các điểm điều tra chứa chút truyền thuyết ở một số khu vực",
	"Add new perks (stressed, cursed, accomplished, lucky, restart bonus)": "Thêm các đặc quyền mới (căng thẳng, nguyền rủa, thành đạt, may mắn, thưởng khởi đầu lại)",
	"Rename 'favour' to 'hope', 'follower' to 'explorer', and adjust a few other terms": "Đổi “favour” thành “hope”, “follower” thành “explorer” và điều chỉnh một số thuật ngữ khác",
	"Add more items, enemy types and locale types to support story and world-building": "Thêm vật phẩm, loại kẻ địch và loại địa điểm để hỗ trợ cốt truyện và xây dựng thế giới",
	"Add varying quality to equipment items": "Bổ sung chất lượng khác nhau cho trang bị",
	"Make medicine and herbs more useful": "Khiến thuốc và thảo dược hữu dụng hơn",
	"Add better save management": "Cải thiện quản lý bản lưu",
	"Add a popup with some game stats": "Thêm popup hiển thị một số chỉ số trò chơi",
	"Add a settings menu and make hotkeys more visible and configurable": "Thêm menu cài đặt, đồng thời làm phím tắt dễ thấy và dễ cấu hình hơn",
	"Make it possible for population to grow by more than 1 at once": "Cho phép dân số tăng hơn 1 người mỗi lần",
	"Add dedicated metal scavenging spots (heaps)": "Thêm các điểm thu nhặt kim loại chuyên biệt (đống phế liệu)",
	"Add option to move a few more steps when out of food or water": "Thêm tùy chọn đi thêm vài bước khi hết thức ăn hoặc nước",
	"Add basic UI sounds": "Thêm âm thanh giao diện cơ bản",
	"Change the log to only show messages relevant for current location": "Thay đổi nhật ký để chỉ hiển thị thông báo liên quan đến vị trí hiện tại",
	"Improve mobile layout a bit and add a warning for mobile devices": "Cải thiện đôi chút bố cục trên di động và thêm cảnh báo cho thiết bị di động",
	"Improve page structure for screen readers": "Cải thiện cấu trúc trang cho trình đọc màn hình",
	"Add rare prebuilt passages between levels": "Thêm các lối đi dựng sẵn hiếm gặp giữa các tầng",
	"Lay some groundwork for translations by moving most (but not all) strings to a separate file": "Đặt nền móng cho việc dịch thuật bằng cách chuyển phần lớn (nhưng chưa phải tất cả) chuỗi sang tệp riêng",
	"Lots of bugfixes, balancing adjustments, UI improvements and text polish": "Nhiều sửa lỗi, điều chỉnh cân bằng, cải thiện giao diện và trau chuốt câu chữ",
	"Fix a bug where camp resources sometimes got reset": "Sửa lỗi đôi khi tài nguyên trại bị đặt lại",
	"Bugfixes and text corrections": "Sửa lỗi và chỉnh sửa câu chữ",
	"Add simple ending": "Thêm đoạn kết đơn giản",
	"Add milestones and limits to evidence / rumour / favour accumulation based on milestones": "Thêm các cột mốc và giới hạn cho việc tích lũy bằng chứng / tin đồn / ân huệ dựa trên cột mốc",
	"Add investigate action and insight stat": "Thêm hành động điều tra và chỉ số nhận thức",
	"Add study at library action": "Thêm hành động học tập tại thư viện",
	"Add breaking and repairing items": "Thêm cơ chế làm hỏng và sửa vật phẩm",
	"Add luxury resources and outposts": "Thêm tài nguyên xa xỉ và tiền đồn",
	"Add worker robots": "Thêm robot lao động",
	"Add more permanent and temporary effects (tired, blessed, varied injuries)": "Bổ sung thêm hiệu ứng vĩnh viễn và tạm thời (mệt mỏi, ban phước, nhiều loại thương tích)",
	"Add more follower types": "Thêm nhiều loại người theo hơn",
	"Add a chance that defenders (soldiers) get killed or buildings damaged during raids": "Thêm khả năng quân phòng thủ (lính) bị giết hoặc công trình bị hư hại trong các cuộc đột kích",
	"Improve the map (modes, readability fixes and layout improvements)": "Cải thiện bản đồ (chế độ, sửa khả năng đọc và cải thiện bố cục)",
	"Remove many repetitive log messages and add some new ones": "Xóa nhiều thông báo nhật ký lặp lại và thêm một số thông báo mới",
	"Many smaller UI improvements": "Nhiều cải thiện nhỏ cho giao diện",
	"Fix a few issues related to fight and hazard balancing": "Sửa một số vấn đề liên quan đến cân bằng chiến đấu và hiểm họa",
	"Allow building a barracks regardless of camp population": "Cho phép xây doanh trại bất kể dân số trại",
	"Fix error when using a First Aid Kit": "Sửa lỗi khi sử dụng Túi sơ cứu",
	"Other bugfixes": "Các sửa lỗi khác",
	"Fix several issues with world generation and fight balancing that could cause soft locks": "Sửa một số vấn đề về tạo thế giới và cân bằng chiến đấu có thể khiến trò chơi bị kẹt",
	"Adjust costs and checks to make the start a little bit easier": "Điều chỉnh chi phí và điều kiện để giai đoạn đầu dễ hơn một chút",
	"Unlock more levels": "Mở khóa thêm các tầng",
	"Add many more enemy types and many new items": "Thêm nhiều loại kẻ địch và vật phẩm mới",
	"Improve followers and add different follower abilities": "Cải thiện người theo và thêm các khả năng khác nhau cho họ",
	"Add locations with scavengeable crafting ingredients": "Thêm các địa điểm có nguyên liệu chế tạo có thể thu nhặt",
	"Make building effects clearer (upgrades unlock building levels, no automatic effects)": "Làm rõ tác dụng của công trình (nâng cấp mở khóa cấp công trình, không còn hiệu ứng tự động)",
	"Add upgrades to traps and buckets": "Thêm nâng cấp cho bẫy và xô",
	"Add map pieces and graffiti that help navigating new areas": "Thêm mảnh bản đồ và hình vẽ graffiti giúp định hướng ở khu vực mới",
	"Make some debuffs (hunger, thirst, cold, poison, radiation) more forgiving by adding them slowly instead of immediately": "Khiến một số hiệu ứng bất lợi (đói, khát, lạnh, độc, phóng xạ) dễ chịu hơn bằng cách cộng dồn từ từ thay vì xuất hiện ngay lập tức",
	"Polish the Rejuv Shot (block using twice; only restores stamina and doesn't affect max stamina)": "Trau chuốt Ống tiêm hồi phục (chặn việc dùng hai lần; chỉ hồi phục thể lực và không ảnh hưởng thể lực tối đa)",
	"Adjust balancing for buildings, crafting, upgrades, fights, raids and scavenging results": "Điều chỉnh cân bằng cho công trình, chế tạo, nâng cấp, chiến đấu, đột kích và kết quả thu nhặt",
	"Improve UI for screen reader users": "Cải thiện giao diện cho người dùng trình đọc màn hình",
	"Adjust upgrade/evidence balancing": "Điều chỉnh cân bằng nâng cấp/bằng chứng",
	"Small bugfixes": "Sửa một số lỗi nhỏ",
	"Adjust upgrade unlocking order (ensure unlocking Knife doesn't block Compass)": "Điều chỉnh thứ tự mở khóa nâng cấp (đảm bảo mở khóa Dao không chặn La bàn)",
	"Add tools page with limited cheats to help players affected by bugs": "Thêm trang công cụ với các mã gian lận giới hạn để hỗ trợ người chơi bị ảnh hưởng bởi lỗi",
	"New levels (the ground level and level 14, an extremely radioactive level)": "Các tầng mới (tầng mặt đất và tầng 14, một tầng có phóng xạ cực mạnh)",
	"Deity, favour, temples, shrines, greenhouses, and a new resource (rubber)": "Thần linh, ân huệ, đền thờ, miếu thờ, nhà kính và tài nguyên mới (cao su)",
	"New equipment for surviving extremely irradiated levels": "Thêm trang bị mới để sinh tồn ở các tầng bị chiếu xạ cực mạnh",
	"New consumable item that restores stamina": "Thêm vật phẩm tiêu hao mới giúp hồi phục thể lực",
	"New building: beacon": "Công trình mới: đài hiệu",
	"More challenges and rewards to campless levels (more encounters, blueprints)": "Thêm thử thách và phần thưởng cho các tầng không có trại (nhiều cuộc chạm trán và bản thiết kế hơn)",
	"Improved sector descriptions": "Cải thiện mô tả khu vực",
	"Make all fights drop crafting ingredients": "Khiến mọi trận chiến rơi nguyên liệu chế tạo",
	"Introduce scavenged %, giving diminishing rewards for scavenging the same sector": "Giới thiệu tỷ lệ đã thu nhặt, khiến phần thưởng giảm dần khi thu nhặt cùng một khu vực nhiều lần",
	"UI improvements (collect 1, simplify rest outside, animations for numbers)": "Cải thiện giao diện (thu thập 1, đơn giản hóa nghỉ ngơi bên ngoài, hoạt ảnh cho con số)",
	"Improved world generation (structure, hard levels, validation)": "Cải thiện việc tạo thế giới (cấu trúc, tầng khó, kiểm tra hợp lệ)",
	"Adjust upgrade unlocking order (Block Knife from being unlocked on Level 13)": "Điều chỉnh thứ tự mở khóa nâng cấp (ngăn Dao được mở khóa ở Tầng 13)",
	"Bugfixes": "Sửa lỗi",
	"Add possibility to improve (some) buildings for small effect boosts": "Thêm khả năng cải thiện một số công trình để nhận tăng cường hiệu ứng nhỏ",
	"Add active and passive rumour generation to markets": "Thêm cơ chế tạo tin đồn chủ động và thụ động ở chợ",
	"Add a new movement blocker: debris": "Thêm vật cản di chuyển mới: đống đổ nát",
	"Adjust level sizes and structure": "Điều chỉnh kích thước và cấu trúc tầng",
	"Adjust balancing (raids, rumours, upgrades, reputation)": "Điều chỉnh cân bằng (đột kích, tin đồn, nâng cấp, danh tiếng)",
	"Add more items, equipment and crafting materials": "Thêm vật phẩm, trang bị và nguyên liệu chế tạo",
	"Add more enemies and make enemy difficulty more dynamic": "Thêm kẻ địch và khiến độ khó của kẻ địch biến động linh hoạt hơn",
	"Improve fight UI": "Cải thiện giao diện chiến đấu",
	"Refactor CSS styles and color themes for easier maintanability": "Tái cấu trúc kiểu CSS và chủ đề màu để dễ bảo trì hơn",
	"Bugfixes and testing tools": "Sửa lỗi và công cụ kiểm thử",
	"Improved tech tree visualization": "Cải thiện hiển thị cây công nghệ",
	"Improved maps": "Cải thiện bản đồ",
	"New building: caravan stable": "Công trình mới: chuồng xe",
	"Smaller saves": "Bản lưu nhỏ gọn hơn",
	"Bigger difference between camps on different levels (population density)": "Tăng khác biệt giữa các trại ở các tầng khác nhau (mật độ dân số)",
	"Balancing improvements (upgrades, storage capacity, building costs)": "Cải thiện cân bằng (nâng cấp, sức chứa kho, chi phí công trình)",
	"Visual view of the current camp and its buildings": "Hiển thị trực quan trại hiện tại và các công trình của trại",
	"Improved world generation and better level structure": "Cải thiện việc tạo thế giới và cấu trúc tầng",
	"Option to export/import save. (Breaks old saves)": "Tùy chọn xuất/nhập bản lưu. (Không tương thích bản lưu cũ)",
	"Manually choosing equipped items": "Tự chọn vật phẩm được trang bị",
	"Remove time-based food/water consumption and time-based stamina recovery while exploring": "Loại bỏ việc tiêu thụ thức ăn/nước theo thời gian và hồi phục thể lực theo thời gian khi thám hiểm",
	"Polished reputation, raids and trade": "Trau chuốt danh tiếng, đột kích và giao thương",
	"Two new buildings that increase reputation: Garden and Square": "Hai công trình mới giúp tăng danh tiếng: Vườn và Quảng trường",
	"Improved performance": "Cải thiện hiệu năng",
	"Simple ending to the game": "Đoạn kết đơn giản cho trò chơi",
	"Improved UI for building projects": "Cải thiện giao diện dự án xây dựng",
	"Lots of bugfixes, especially for late-game": "Nhiều sửa lỗi, đặc biệt ở giai đoạn cuối trò chơi",
	"Currency, trade partners on the map, outgoing trade caravans and incoming traders": "Tiền tệ, đối tác giao thương trên bản đồ, đoàn xe giao thương đi ra và thương nhân đến",
	"More varied resources found when scavenging": "Tài nguyên tìm được khi thu nhặt đa dạng hơn",
	"More bag levels": "Thêm nhiều cấp độ túi hơn",
	"Bugfixes and performance improvements": "Sửa lỗi và cải thiện hiệu năng",
	"Lots of small bugfixes": "Nhiều sửa lỗi nhỏ",
	"A friendly popup when the game crashes": "Thêm popup thân thiện khi trò chơi gặp sự cố",
	"Visualization of the tech tree": "Hiển thị trực quan cây công nghệ",
	"Reputation logic changed (camp-dependent and changing over time)": "Thay đổi logic danh tiếng (phụ thuộc vào trại và thay đổi theo thời gian)",
	"New building: generator (increases reputation)": "Công trình mới: máy phát điện (tăng danh tiếng)",
	"Rebalanced upgrades and a few new ones. Several buildings can now be upgraded": "Cân bằng lại các nâng cấp và thêm một số nâng cấp mới. Một số công trình giờ đây có thể được nâng cấp",
	"Lots of small UI fixes and additions": "Nhiều sửa lỗi và bổ sung nhỏ cho giao diện",
	"Improved followers and inn functionality": "Cải thiện người theo và chức năng nhà trọ",
	"Lots of new log messages for results of player actions when exploring": "Nhiều thông báo nhật ký mới cho kết quả hành động của người chơi khi thám hiểm",
	"Improved header appearance and show item stats more clearly": "Cải thiện giao diện phần đầu và hiển thị chỉ số vật phẩm rõ ràng hơn",
	"Improved sector generation (more intersections and more interesting level shapes)": "Cải thiện việc tạo khu vực (nhiều giao lộ hơn và hình dạng tầng thú vị hơn)",
	"Rework how food and water work while exploring & add springs": "Thiết kế lại cách thức ăn và nước hoạt động khi thám hiểm, đồng thời thêm các mạch nước",
	"Proper inventory management and add weights for items": "Quản lý hành trang hoàn chỉnh và thêm trọng lượng cho vật phẩm",
	"Stamina regeneration much slower while exploring and option to recover it in camp": "Hồi phục thể lực chậm hơn nhiều khi thám hiểm và thêm tùy chọn hồi phục tại trại",
	"New items: first aid kits and glowsticks": "Vật phẩm mới: túi sơ cứu và que phát sáng",
	"Environmental hazards: cold, radiation and poison": "Hiểm họa môi trường: lạnh, phóng xạ và độc",
	"More clothing slots & items": "Thêm ô trang phục và vật phẩm",
	"Some items can be left in the camp (and not lost them when fainting)": "Một số vật phẩm có thể để lại trong trại (và không bị mất khi ngất)",
	"Blueprints are made of pieces which must be separately collected": "Bản thiết kế được chia thành các mảnh cần thu thập riêng",
	"Notifications for new content in tabs like available buildigs or items": "Thông báo khi có nội dung mới trong các tab như công trình hoặc vật phẩm có thể sử dụng",
	"Improved exploration UI": "Cải thiện giao diện thám hiểm",
	"Levels are composed of randomly generated paths and have intersections": "Các tầng được tạo thành từ những con đường ngẫu nhiên và có các giao lộ",
	"Fights changed from action to random encounters": "Chuyển chiến đấu từ hành động trực tiếp sang các cuộc chạm trán ngẫu nhiên",
	"Exploration more risky, but also has more rewards": "Thám hiểm nguy hiểm hơn nhưng cũng có nhiều phần thưởng hơn",
	"Healing injuries is no longer instant": "Chữa thương không còn diễn ra tức thì",
	"New improvement: aqueduct": "Công trình mới: cống dẫn nước",
	"Timer for next worker": "Hẹn giờ cho lao động kế tiếp",
	"Levels where no camp can be built": "Các tầng không thể xây trại",
	"Initial list of upgrades, upgrades balancing & blueprint mechanic": "Danh sách nâng cấp ban đầu, cân bằng nâng cấp và cơ chế bản thiết kế",
	"Working crafting system and all basic items. Secondary resources (crafting ingredients)": "Hệ thống chế tạo hoạt động cùng toàn bộ vật phẩm cơ bản. Tài nguyên phụ (nguyên liệu chế tạo)",
	"Exploration now requires food and water": "Thám hiểm giờ cần thức ăn và nước",
	"Locales: new scouting opportunities that appear on some sectors": "Địa điểm: các cơ hội do thám mới xuất hiện tại một số khu vực",
	"Black skin for dark levels/sectors": "Da đen cho các tầng/khu vực tối",
	"Initial building list": "Danh sách công trình ban đầu",
	"Basic camp game play": "Lối chơi trại cơ bản",
	"Basic exploration": "Thám hiểm cơ bản"
};

$.getJSON('changelog.json', function (json) {
	versions = json.versions;
	
	var html = "<h4 class='infobox-scrollable-header'>Nhật ký thay đổi</h4>";
	html += "<div id='changelog' class='infobox infobox-scrollable'>";
	
	var v;
	for (let i in versions) {
		v = versions[i];
		if (v.changes.length === 0) continue;
		html += "<div class='changelog-version'>";
		html += "<b>phiên bản " + v.version + " (" + v.phase + ")";
		if (v.final) html += " phát hành: " + v.released + "";
		else html += " (đang phát triển)";
		html += "</b>";
		html += "<ul>";
		for (let j in v.changes) {
			var change = v.changes[j];
			var summary = change.summary.trim().replace(/\.$/, "");
			summary = summaryTranslations[summary] || summary;
			html += "<li class='changelog-" + change.type + "'>";
			html += "<span class='changelog-summary'>" + summary + "</span>";
			html += "</li>";
		}
		html += "</ul>";
		html += "</div>";
	}
	html += "</div>";
	
	$("#changelog-container").html(html);
})
