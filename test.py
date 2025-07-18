m = []


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
    print(f"    'name':{i['name']},'money':{i['money']},")