import json
from datetime import datetime

def json_to_html(detail_json):
    html = ""
    for item in detail_json:
        if isinstance(item, dict) and 'type' in item and 'content' in item:
            if item['type'] == 1:
                html += f"{item['content']}<div><br></div>"
            elif item['type'] == 2:
                html += f'<img src="/{item["content"]}" style="max-width: 100%;">'
    return html

# 读取JSON文件
with open('test.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# 准备插入语句
insert_sql = '''
INSERT INTO Contents (id, simpleInfo, preview, location, price, area, detail, commnet, city, createdAt, updatedAt, hiddenContent)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
'''

# 打开文件以写入SQL语句
with open('sql.txt', 'w', encoding='utf-8') as sql_file:
    # 遍历JSON数据并生成SQL语句
    for item in data['data']:
        # 将detail JSON转换为HTML
        detail_html = json_to_html(item['detail'])
        
        # 将commnet列表转换为JSON字符串
        commnet_json = json.dumps(item['commnet'], ensure_ascii=False)
        
        # 获取当前时间作为createdAt和updatedAt
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # 准备数据
        values = (
            item['id'],
            item['simpleInfo'],
            '/'+item['preview'],
            item['location'],
            item['price'],
            item['area'],
            detail_html,
            commnet_json,
            '北京',  # 默认城市
            current_time,  # createdAt
            current_time,  # updatedAt
            item.get('hiddenContent', '')  # 如果没有hiddenContent，使用空字符串
        )
        
        # 生成SQL语句并写入文件
        sql = insert_sql.replace('?', '{}').format(*(repr(v) for v in values))
        sql_file.write(sql + ';\n')  # 添加分号和换行符
        sql_file.write('-' * 80 + '\n')  # 分隔线

print("SQL语句已生成并保存到 sql.txt 文件中。")
