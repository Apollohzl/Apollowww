import sys
import json
import time
import io
import os

#登录



sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def cheek_pass_name(listOfmsg):
    try:
        inputname = listOfmsg[0]
        inputpass = listOfmsg[1]
    except IndexError:
        print("请提供用户名和密码。")
        return

    
    
    try:
        with open(r'F:\py\Node登录系统\userbook.json', 'r', encoding='utf-8') as file:
            Read_book = json.load(file)
    except FileNotFoundError:
        print(r"文件未找到: 用户信息文件未找到")
        return
    except json.JSONDecodeError:
        print("读取数据文件时发生错误。")
        return

    for Dict in Read_book:
        Dictname = Dict['name']
        if inputname == Dictname:
            Dictpass = Dict['password']
            if inputpass == Dictpass:
                remsg = {
                    "code":0,
                    "msg":f"用户信息正确 \n{Dict['name2']} \n欢迎回来 \n",
                    "src":Dict['headpicture']
                }
                print(json.dumps(remsg, ensure_ascii=False))
                Setuplog(inputname, inputpass)
                return
            
    remsg = {
                "code":400,
                "msg":"用户信息错误, 请重新输入或联系工作人员",
            }
    print(json.dumps(remsg, ensure_ascii=False))
    Setuplog(inputname, inputpass, "False")

def Setuplog(name, passw, tf="True"):


    try:
        with open(r'F:\py\Node登录系统\setupxinxi.json', 'r', encoding='utf-8') as file:
            xinxilist = json.load(file)
    except FileNotFoundError:
        xinxilist = []
    except json.JSONDecodeError:
        print("50:读取 JSON 文件时发生错误。")
        return

    # 使用字典存储信息
    xinxilog = {
        "name": name,
        "password": passw,
        "time": time.time(),
        "TF": tf
    }
    
    xinxilist.append(xinxilog)

    # 以写入模式打开文件，确保可以成功写入
    with open(r'F:\py\Node登录系统\setupxinxi.json', 'w', encoding='utf-8') as file:
        json.dump(xinxilist, file, ensure_ascii=False, indent=4)

def main():
    try:
        input_value = sys.argv[1:]  # 从命令行参数获取输入
    except IndexError:
        print("没有提供输入参数。")
    else:
        cheek_pass_name(input_value)

if __name__ == "__main__":
    main()
