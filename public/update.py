import json

# 读取 JSON 文件（假设文件名为 papers.json）
with open('paper_data.json', 'r', encoding='utf-8') as file:
    papers = json.load(file)

# 遍历每个项，为每个项添加 id 字段，id 为索引（从 1 开始）
for index, paper in enumerate(papers, start=1):
    paper["id"] = index

# 将更新后的数据保存到新的 JSON 文件中（例如 papers_with_id.json）
with open('papers_with_id.json', 'w', encoding='utf-8') as file:
    json.dump(papers, file, ensure_ascii=False, indent=2)

print("已成功为每个项添加索引作为 id 并保存到 'papers_with_id.json' 文件中")
