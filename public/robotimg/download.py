import requests
import os



# 下载函数
def download_image(url, filename):
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            with open(filename, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            print(f"成功下载: {filename}")
        else:
            print(f"下载失败，HTTP状态码: {response.status_code} - {url}")
    except Exception as e:
        print(f"下载出错: {e} - {url}")

# 下载0-21的图片
for i in range(22):  # 0到21共22个数字
    url = f"https://ken520.top/wp-content/themes/zibll/img/captcha/{i}.jpg"
    filename = f"F:/py/Apollo登录系统/public/robotimg/{i}.jpg"
    download_image(url, filename)

print("下载任务完成！")