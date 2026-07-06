import json
import os

data = {
  "subtitle": "Một hội thánh vươn ra cho thế hệ này.",
  "history_p1": "Hội Thánh R.E.A.C.H là một hội thánh trẻ, được thành lập vào năm 2017 dưới sự dẫn dắt của Mục sư David Tô. Với khải tượng \"Dứt Dấy Nhân Sự để Hoàn Tất Đại Mạng Lệnh,\" R.E.A.C.H không ngừng nỗ lực để nuôi dưỡng và phát triển những người lãnh đạo trẻ, hướng đến việc hoàn thành sứ mạng mà Chúa Jêsus đã giao phó.",
  "history_p2": "Trải qua nhiều khó khăn và bắt bớ, R.E.A.C.H vẫn kiên cường đứng vững và tiếp tục lan tỏa tình yêu của Chúa đến với mọi người. Hội Thánh tọa lạc tại thành phố Đà Nẵng, một trong những thành phố năng động của miền Trung Việt Nam.",
  "history_p3": "Hiện tại, R.E.A.C.H có hai điểm nhóm chính, sáu điểm nhóm tế bào, và được tạo nên từ tám sắc tộc khác nhau, với phần lớn tín hữu là những người trẻ. Hội Thánh R.E.A.C.H không chỉ là nơi để cùng nhau thờ phượng và học hỏi Lời Chúa, mà còn là một cộng đồng gắn kết, nơi mỗi người đều có thể tìm thấy mục đích và ý nghĩa trong cuộc sống thông qua mối quan hệ mật thiết với Chúa và với nhau.",
  "mission_title": "Sứ Mạng & Mục Tiêu",
  "mission_intro": "Hội Thánh R.E.A.C.H cam kết thực hiện sứ mạng của mình qua các mục tiêu:",
  "mission_1_title": "TÔN CAO CHÚA JESUS",
  "mission_1_desc": "Chúng tôi đặt Chúa Jêsus làm trọng tâm của mọi hoạt động, nhằm tôn vinh Ngài qua đời sống và hành động của mình.",
  "mission_2_title": "XÂY DỰNG MỐI THÔNG CÔNG",
  "mission_2_desc": "Chúng tôi tạo dựng một cộng đồng yêu thương và gắn kết giữa các tín hữu, nơi mọi người được khích lệ, hỗ trợ và phát triển trong đức tin.",
  "mission_3_title": "MÔN ĐỒ HOÁ",
  "mission_3_desc": "Chúng tôi cam kết huấn luyện và trang bị các tín hữu trở thành môn đồ của Chúa Jêsus, sẵn sàng phục vụ và lãnh đạo trong Hội Thánh và xã hội.",
  "mission_4_title": "TRUYỀN GIẢNG PHÚC ÂM",
  "mission_4_desc": "Chúng tôi quyết tâm chia sẻ Phúc Âm và đem ánh sáng của Chúa đến với mọi người, giúp họ nhận biết và tin nhận Ngài.",
  "mission_5_title": "MỞ MANG HỘI THÁNH",
  "mission_5_desc": "Chúng tôi tích cực mở rộng Hội Thánh qua việc thành lập thêm các điểm nhóm, xây dựng Hội Thánh địa phương và phát triển vương quốc Đức Chúa Trời.",
  "values_title": "Giá Trị Cốt Lõi",
  "value_1_title": "1. Lấy Chúa Jêsus là trọng tâm",
  "value_1_desc": "Mọi điều chúng tôi làm đều xuất phát từ niềm tin vào Chúa Jêsus và sự cứu chuộc của Ngài.",
  "value_2_title": "2. Lấy Kinh Thánh làm chuẩn mực",
  "value_2_desc": "Kinh Thánh là nền tảng và hướng dẫn cho mọi quyết định và hành động của chúng tôi.",
  "value_3_title": "3. Tôn kính thẩm quyền",
  "value_3_desc": "Chúng tôi tôn trọng và vâng phục các thẩm quyền được Đức Chúa Trời thiết lập.",
  "value_4_title": "4. Bước đi trong Thánh Linh",
  "value_4_desc": "Chúng tôi tìm kiếm và lắng nghe sự hướng dẫn của Thánh Linh trong mọi việc.",
  "value_5_title": "5. Bước đi trong Tình Yêu Thương",
  "value_5_desc": "Chúng tôi sống và hành động với tình yêu thương, luôn hướng tới sự hòa giải và xây dựng mối quan hệ tốt đẹp.",
  "value_6_title": "6. Chú trọng xây dựng phẩm chất Đấng Christ",
  "value_6_desc": "Chúng tôi khích lệ các tín hữu phát triển phẩm chất và nếp sống phản ánh Đấng Christ.",
  "value_7_title": "7. Mang tinh thần Vương Quốc",
  "value_7_desc": "Chúng tôi sống với tầm nhìn và mục tiêu hướng tới việc mở rộng vương quốc Đức Chúa Trời.",
  "value_8_title": "8. Ban cho rộng rãi",
  "value_8_desc": "Chúng tôi thực hành sự ban cho với tấm lòng rộng rãi, phản ánh tình yêu của Chúa.",
  "value_9_title": "9. Phụng sự Chúa",
  "value_9_desc": "Chúng tôi cam kết phụng sự Chúa bằng việc phục vụ cộng đồng và Hội Thánh.",
  "value_10_title": "10. Sống nếp sống Chứng Nhân",
  "value_10_desc": "Sống nếp sống chứng nhân của Đấng Christ."
}

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = json.load(f)
    content['settings_about'] = data
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(content, f, ensure_ascii=False, indent=2)

update_file('e:/ALBUM/MY PROJECTS/reach-church/src/locales/vi.json')
update_file('e:/ALBUM/MY PROJECTS/reach-church/src/locales/en.json')
update_file('e:/ALBUM/MY PROJECTS/reach-church/src/locales/ko.json')
