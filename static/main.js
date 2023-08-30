// 当 DOM 加载完成后执行
document.addEventListener("DOMContentLoaded", function () {
    // 获取页面元素
    const speedText = document.getElementById("speed-text");  // 显示速度的文本区域
    const startSingleBtn = document.getElementById("start-single");  // 单线程测试按钮
    const startMultiBtn = document.getElementById("start-multi");  // 多线程测试按钮
    const speedChartCanvas = document.getElementById("speedChart");  // 获取画布元素用于图表

    // 定义 API 地址
    const apiUrl = `${window.location.origin}/speedtest`;
    let startTime = 0;  // 测试开始时间
    let totalDataReceived = 0;  // 总共接收的数据量
    let lastUpdateTimestamp = 0;  // 上次更新时间戳
    let speedChart = null;  // 存储 Chart.js 实例

    // 更新速度显示
    const updateSpeed = (speed) => {
        speedText.textContent = `Speed: ${speed.toFixed(2)} MB/s`;  // 设置文本内容
    };

    // 更新图表数据
    const updateChart = (speedData) => {
        const timestamp = new Date().toLocaleTimeString();  // 获取当前时间

        // 添加新的数据点，如果标签数量超过 10，则删除第一个数据点
        speedChart.data.labels.push(timestamp);
        speedChart.data.datasets[0].data.push(speedData);
        if (speedChart.data.labels.length > 10) {
            speedChart.data.labels.shift();
            speedChart.data.datasets[0].data.shift();
        }
        speedChart.update();  // 更新图表
    };

    // 执行网速测试
    const runSpeedTest = async (mode, threadCount = 1) => {
        // 创建或重新创建 Chart.js 实例
        if (speedChart) {
            speedChart.destroy();  // 如果存在则销毁旧的图表
        }
        speedChart = new Chart(speedChartCanvas.getContext("2d"), {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: "Speed (MB/s)",
                    data: [],
                    fill: false,
                    borderColor: "rgb(75, 192, 192)",
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: { beginAtZero: true },
                    y: { beginAtZero: true }
                }
            }
        });

        totalDataReceived = 0;  // 重置总数据量
        const dataSize = 200000000;  // 设置数据包大小
        const params = new URLSearchParams({ mode, size: dataSize });  // 设置查询参数
        startTime = performance.now();  // 记录开始时间
        lastUpdateTimestamp = 0;  // 重置上次更新时间戳

        // 使用 fetch API 获取数据并进行测速
        const fetchPromises = Array.from({ length: threadCount }, () => fetchAndMeasure(`${apiUrl}?${params}`));
        await Promise.all(fetchPromises);

        // 计算平均速度并更新图表
        const elapsedSeconds = (performance.now() - startTime) / 1000;
        const speed = totalDataReceived / (1024 * 1024) / elapsedSeconds;
        updateSpeed(speed);
        updateChart(speed);
    };

    // 使用 fetch API 获取数据并进行测速
    const fetchAndMeasure = async (url) => {
        const response = await fetch(url);
        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            totalDataReceived += value.length;

            const now = performance.now();
            if (now - lastUpdateTimestamp >= 1000) {
                const elapsedSeconds = (now - startTime) / 1000;
                const currentSpeed = totalDataReceived / (1024 * 1024) / elapsedSeconds;

                // 更新图表并重置数据
                updateChart(currentSpeed);
                lastUpdateTimestamp = now;
                startTime = now;
                totalDataReceived = 0;
            }
        }
    };

    // 绑定按钮事件
    startSingleBtn.addEventListener("click", () => runSpeedTest("single"));  // 单线程测试
    startMultiBtn.addEventListener("click", () => runSpeedTest("multi", 4));  // 多线程测试
});
