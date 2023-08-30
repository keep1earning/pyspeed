from flask import Flask, render_template, Response, request  # 导入 Flask 库和相关组件
from flask_cors import CORS  # 用于处理跨域请求
import time  # 用于测量时间
import logging  # 用于记录日志
from waitress import serve  # 使用 Waitress 作为 WSGI 服务器

app = Flask(__name__)  # 初始化 Flask 应用
CORS(app, resources={r"/speedtest": {"origins": "*"}})  # 允许所有来源的请求访问 /speedtest 路径

logging.basicConfig(level=logging.INFO)  # 设置日志级别为 INFO

@app.route('/')  # 定义应用的根路径
def home():  # 主页的处理函数
    logging.info("Home page accessed.")  # 记录日志：主页被访问
    return render_template('index.html')  # 返回 index.html 模板

@app.route('/speedtest', methods=['GET'])  # 定义 /speedtest 路径，仅接受 GET 请求
def speedtest():  # 网速测试的处理函数
    size = int(request.args.get('size', 200000000))  # 从请求参数中获取 'size'，默认值为 200000000
    start_time = time.time()  # 记录开始时间
    data = b'1' * size  # 生成 size 大小的二进制数据，内容为 "1"
    elapsed_time = time.time() - start_time  # 计算生成数据所需的时间
    logging.info(f"Speedtest initiated. Data size: {size} bytes, Time taken to generate data: {elapsed_time:.2f} seconds.")  # 记录日志

    # 创建一个流式响应，返回生成的数据
    response = Response(data, content_type='application/octet-stream')  
    response.headers.set('Content-Length', str(size))  # 设置 Content-Length 头
    response.headers.set('X-Elapsed-Time', str(elapsed_time))  # 设置自定义头 X-Elapsed-Time

    return response  # 返回响应

if __name__ == '__main__':  # 确保这个脚本被直接运行，而不是作为模块导入
    serve(app, host='0.0.0.0', port=5000)  # 使用 Waitress 运行 Flask 应用，监听所有 IP 地址，端口为 5000
