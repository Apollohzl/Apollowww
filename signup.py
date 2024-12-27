import sys
import json
import time
import io
import os

#注册

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def cheekinput(name="",passworda="",passwordb="",nameb=""):
    if not(nameb):
        nameb=name
    if name and passworda==passwordb and passworda and passwordb:
        newdictuser={
            "name":name,
            "name2":nameb,
            "password":str(passworda),
            "headpicture":"",
            "write":"随便写点什么吧~（50字符以内；注意避免暴露个人敏感信息，如手机/qq号等）"
        }
        try:
            with open(r'F:\py\Node登录系统\userbook.json', 'r', encoding='utf-8') as file:
                xinxilist = json.load(file)
        except FileNotFoundError:
            xinxilist = []
        except json.JSONDecodeError:
            print("50:读取 JSON 文件时发生错误。")
            return
        xinxilist.append(newdictuser)
        with open(r'F:\py\Node登录系统\userbook.json', 'w', encoding='utf-8') as file:
            json.dump(xinxilist, file, ensure_ascii=False, indent=4)
        print(json.dumps({"code":0,"msg":"注册成功!"}, ensure_ascii=False))
            
    else:
        msg = ""
        if not(name):
            msg += "请输入名字 \n"
        if not(passworda):
            msg += "请输入密码 \n"
        if passworda and not(passwordb):
            msg += "请输入确认密码 \n"
        if passworda and passwordb and passworda != passwordb:
            msg += "请输入相同的密码 \n"
        
        print(json.dumps({"code":400,"msg":msg}, ensure_ascii=False))



def main():
    try:
        input_value = sys.argv[1:]  # 从命令行参数获取输入
    except IndexError:
        print("请输入信息")
    else:
        cheekinput(input_value[0],input_value[1],input_value[2],input_value[3])
        

if __name__ == "__main__":
    main()
