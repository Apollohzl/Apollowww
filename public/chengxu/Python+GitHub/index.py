import tkinter as tk
from tkinter import filedialog, messagebox
import os
import time
import subprocess

# 创建界面
def create_gui():
    # 创建主窗口
    root = tk.Tk()
    root.title("Git 提交工具")
    
    # 创建输入框标签
    label = tk.Label(root, text="提交信息:")
    label.grid(row=0, column=0, padx=10, pady=10)
    
    # 创建输入框
    entry = tk.Entry(root, width=40)
    entry.grid(row=0, column=1, padx=10, pady=10)
    
    # 创建文件夹选择按钮
    folder_path = tk.StringVar()
    def choose_folder():
        folder = filedialog.askdirectory()  # 打开文件夹选择对话框
        if folder:
            folder_path.set(folder)
            print(f"选择的文件夹路径:{folder}")
    
    folder_button = tk.Button(root, text="选择文件夹", command=choose_folder)
    folder_button.grid(row=1, column=0, padx=10, pady=10)
    
    # 创建提交按钮
    def submit_info():
        folder = folder_path.get()
        commit_message = entry.get()
        
        # 检查文件夹和输入框是否有效
        if not folder:
            messagebox.showwarning("警告", "请先选择文件夹！")
            return
        if not commit_message:
            messagebox.showwarning("警告", "提交信息不能为空！")
            return
        
        # 生成时间戳作为文件名
        timestamp = str(int(time.time()))
        bat_file_path = os.path.join(os.path.dirname(folder), f"{timestamp}.bat")
        print(f"已创建新的BAT文件到 {bat_file_path}")
        # 写入BAT文件内容
        print("写入BAT文件")
        with open(bat_file_path, 'w') as bat_file:
            bat_file.write(f"cd {folder}\n")
            bat_file.write("git add .\n")
            bat_file.write(f"git commit -m \"{commit_message}\"\n")
            bat_file.write("git push origin main\n")
        print("已写入BAT文件")
        # 禁用提交按钮，防止重复点击
        print("禁用提交按钮")
        submit_button.config(state=tk.DISABLED)
        
        # 运行BAT文件
        print("===================start运行BAT文件=======================")
        try:
            subprocess.run(bat_file_path, check=True, shell=True)
            messagebox.showinfo("成功", "提交成功！")
            entry.delete(0, tk.END)
        except subprocess.CalledProcessError:
            messagebox.showerror("错误", "Git 提交失败，请检查配置！")
        print("===================end运行BAT文件=======================")
        # 删除BAT文件
        os.remove(bat_file_path)
        print(f"已删除BAT文件 路径:{bat_file_path}")
        
        # 启用提交按钮
        submit_button.config(state=tk.NORMAL)
        print("启用提交按钮")
    
    submit_button = tk.Button(root, text="提交", command=submit_info)
    submit_button.grid(row=1, column=1, padx=10, pady=10)
    
    # 运行主循环
    root.mainloop()

# 调用创建界面函数
create_gui()
