import os
import json

# 从文件中读取JSON数据
json_file_path = 'paper_data.json'  # 替换为你的JSON文件路径

# 读取文件并解析JSON
with open(json_file_path, 'r', encoding='utf-8') as file:
    papers = json.load(file)

# 获取所有title
titles = [paper['title'] for paper in papers if 'file_link' in paper]

# PDF文件夹路径
pdf_folder_path = './data'  # 替换为你的PDF文件夹路径

# 遍历PDF文件夹
for filename in os.listdir(pdf_folder_path):
    file_path = os.path.join(pdf_folder_path, filename)
    
    # 只处理PDF文件
    if filename.endswith('.pdf'):
        # 获取不带扩展名的文件名
        base_filename = os.path.splitext(filename)[0]
        
        # 检查文件名（去除扩展名后）是否与title匹配
        if base_filename not in titles:
            # 如果没有匹配的title，删除该PDF文件
            print(f"Deleting: {filename}")
            os.remove(file_path)
