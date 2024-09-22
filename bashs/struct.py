import os
from pathlib import Path

def generate_project_structure(directory, output_file, file_types=None):
    exclude_dirs = {'.git', 'node_modules', 'build', 'dist', 'tmp', 'cache','.DS_Store','.env','.vscode'}
    exclude_files = {'.gitignore', 'package-lock.json', 'yarn.lock'}

    def should_include_file(file_path):
        if file_types is None:
            return True
        return file_path.suffix[1:] in file_types

    def traverse_directory(dir_path, prefix=''):
        output_file.write(f"{prefix}{dir_path.name}/\n")

        for item in sorted(dir_path.iterdir()):
            if item.is_dir():
                if item.name not in exclude_dirs:
                    traverse_directory(item, prefix + '  ')
            elif item.is_file():
                if item.name not in exclude_files and should_include_file(item):
                    output_file.write(f"{prefix}  {item.absolute()}的内容是:\n")
                    try:
                        with item.open('r', encoding='utf-8') as f:
                            content = f.read()
                            output_file.write(f"{prefix}    {content}\n")
                        output_file.write(f"\n\n")
                    except UnicodeDecodeError:
                        output_file.write(f"{prefix}    (跳过二进制文件)\n\n")

    with open('a.txt', 'w', encoding='utf-8') as output_file:
        traverse_directory(Path(directory))

if __name__ == "__main__":
    directory = '/Users/momo/Desktop/info-index'

    if not os.path.isdir(directory):
        print(f"目录 {directory} 不存在")
        exit(1)

    print("正在生成项目结构和完整内容...")
    generate_project_structure(directory,directory+'/a.txt')
    print("项目结构和完整内容已保存到 a.txt")
