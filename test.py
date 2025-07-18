m = [
    {'name':'玥涵^.','money':1.12},
    {'name':'玳霖','money':0.09},
    {'name':'刘煜南','money':5.05},
    {'name':'bilibili','money':1.61},
    {'name':'黄文淼','money':0.01},
    {'name':'文跃琪','money':0.09},
    {'name':'依佳','money':0.09},
    {'name':'谢雅蕊','money':0.14},
    {'name':'张赞东','money':1.66},
]


while True:
    a = input("请输入name：")
    if a != "":
        b = input("请输入money：")
        for i in m:
            if i['name'] == a:
                i['money'] += float(b)
                print("更新成功！")
                break
            else:
                print(f"对不上 {i['name']} != {a}")
        else:
            m.append({'name':a,'money':float(b)})
            print("添加成功！")
    else:
        print("输入为空，退出程序！")
        break

for i in m:
    print(f"    \{'name':'{i['name']}'','money':'{i['money']}'\},")