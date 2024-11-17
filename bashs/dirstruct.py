import os
from pathlib import Path

# 定义项目根目录
PROJECT_ROOT = Path(__file__).parent.parent  # 假设脚本在 bashs 目录下

def print_directory_structure(startpath):
    # 获取相对于根目录的路径
    def get_relative_path(path):
        return os.path.relpath(path, startpath)

    # 打印目录结构
    print(f"\nProject Structure (root: {os.path.basename(startpath)})")
    print("=" * 50)

    for root, dirs, files in os.walk(startpath):
        # 跳过 node_modules、.git 目录和 public 的子目录
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules']]
        
        # 如果当前目录是 public，清空其子目录列表
        if os.path.basename(root) == 'public':
            dirs[:] = []
        
        # 获取相对路径
        relative_path = get_relative_path(root)
        
        # 如果是根目录，显示为 "/"
        if relative_path == '.':
            print('/')
            continue
            
        # 计算当前目录的深度
        level = relative_path.count(os.sep)
        indent = '  ' * level
        
        # 打印目录名
        print(f"{indent}├── {os.path.basename(root)}/")
        
        # 打印文件
        subindent = '  ' * (level + 1)
        for file in sorted(files):
            if not file.startswith('.'):  # 跳过隐藏文件
                print(f"{subindent}├── {file}")

if __name__ == "__main__":
    print_directory_structure(PROJECT_ROOT)
