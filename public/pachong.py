from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
import json
import time

def scrape_toolwa():
    # 指定 ChromeDriver 路径
    chrome_driver_path = "F:/py/chromedriver-win64/chromedriver.exe"  # 确保路径正确

    # 设置 Chrome 选项
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-notifications")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("useAutomationExtension", False)
    options.add_argument("--window-size=800,400") 
    
    # 使用 Service 对象指定 driver 路径
    service = Service(executable_path=chrome_driver_path)

    # 初始化 Chrome 驱动
    driver = webdriver.Chrome(service=service, options=options)
    driver.minimize_window()

    try:
        # 打开目标网站
        driver.get("https://toolwa.com/")
        time.sleep(3)
        
        # 查找主容器
        main_container = driver.find_element(By.CSS_SELECTOR, "div.am-container.site-main#index-main")
        
        # 查找所有的ul标签
        ul_list = main_container.find_elements(By.CSS_SELECTOR, "ul.am-avg-sm-2.am-avg-md-3.am-avg-lg-4.am-thumbnails.tool-list")
        
        tools_list = []
        unique_urls = set()  # 用于去重的集合
        
        # 遍历每个ul
        for ul in ul_list:
            # 查找每个ul中的所有li标签
            li_list = ul.find_elements(By.TAG_NAME, "li")
            
            for li in li_list:
                try:
                    # 提取a标签的href
                    a_tag = li.find_element(By.TAG_NAME, "a")
                    href = a_tag.get_attribute("href")
                    
                    # 检查是否已存在相同URL
                    if href in unique_urls:
                        print(f"已存在相同URL: {href}，跳过...")
                        continue
                    
                    # 提取img标签的src
                    img_tag = a_tag.find_element(By.CSS_SELECTOR, "img.tool-icon")
                    img_src = img_tag.get_attribute("src")
                    
                    # 提取h3标签的文本
                    h3_tag = a_tag.find_element(By.TAG_NAME, "h3")
                    name = h3_tag.text
                    
                    # 提取p标签的文本
                    p_tag = a_tag.find_element(By.TAG_NAME, "p")
                    desc = p_tag.text
                    
                    # 创建字典
                    tool_dict = {
                        "img": img_src,
                        "name": name,
                        "desc": desc,
                        "tags": "来自toolwa.com",
                        "path": href
                    }
                    
                    # 添加到结果列表和去重集合
                    tools_list.append(tool_dict)
                    unique_urls.add(href)
                    
                    # 输出当前爬取的信息
                    print(f"爬取到工具: {name} - {href}")
                    
                    # 等待0.1秒
                    time.sleep(0.1)
                    
                except Exception as e:
                    print(f"处理li元素时出错: {e}")
                    continue
        
        # 将结果保存到out.txt
        with open("out.txt", "w", encoding="utf-8") as f:
            json.dump(tools_list, f, ensure_ascii=False, indent=2)
            
        print(f"\n成功爬取{len(tools_list)}个工具信息，已保存到out.txt")
        
    except Exception as e:
        print(f"爬取过程中出错: {e}")
    finally:
        # 关闭浏览器
        driver.quit()

if __name__ == "__main__":
    scrape_toolwa()