---
title: Hello
published: 2025-08-25
description: 一篇简单的 Markdown 博客文章示例。
tags:
  - Obsidian
  - 演示
category: Obsidian
draft: true
---
# Obsidian 睡眠自动化终极指南：从手动抓狂到一键追踪与可视化

大家好！我是第一次写博客的新手，如果你在日常生活中为记录睡眠时间而烦恼——每天手动输入数据、计算时长，还得手动绘制图表——那么这篇文章就是为你量身打造的。我曾经花了整整6个小时调试各种坑，最终搭建出一套全自动的Obsidian睡眠追踪系统。现在，我将一步步带你从零实现它，只需15分钟，你就能享受到“一键睡觉、一键起床”的极致便利，以及自动生成的睡眠数据可视化图表。

为什么选择Obsidian？它免费、开源、支持插件扩展，能将笔记转化为强大的数据管理系统。跟随我的指南，你将学会如何用插件自动化记录睡眠，并通过图表洞察你的作息习惯。准备好了吗？让我们开始吧！

## 最终效果预览

想象一下这样的场景：
1. **晚上准备睡觉时**：按一个快捷键，系统自动在你的睡眠日记中添加一行记录，如 `- [date:: 2025-08-24], [bed:: 23:58], [wake:: ]`。它甚至能智能判断凌晨睡觉（例如凌晨3点），并将日期归为前一天。
2. **早上起床时**：按另一个快捷键，系统自动找到昨晚的未完成记录，补全起床时间，并计算睡眠时长，如 `- [date:: 2025-08-24], [bed:: 23:58], [wake:: 08:15], [duration:: 08:17]`。
3. **数据可视化**：在任意笔记中插入一段代码，就能生成睡眠时长趋势图、平均入睡/起床时间分布图，以及按月/年统计表格。所有数据实时更新，一目了然。

这不仅仅是记录，更是帮助你优化睡眠、提升生活质量的工具。

## 所需工具

- **[Obsidian](https://obsidian.md/)**（免费下载自官网）。
- **插件**（在Obsidian设置 > 社区插件中安装并启用）：
  - **Templater**：核心插件，用于运行JavaScript脚本，实现自动化记录和快捷命令。
  - **Dataview**：用于查询数据并生成图表，支持动态可视化。

安装插件后，重启Obsidian以确保生效。如果你用的是移动端，确保插件兼容。

## Part 1: 配置Templater模板——自动化记录的核心脚本

Templater插件允许我们在模板中使用JavaScript代码，实现动态逻辑。首先，在Obsidian设置中配置Templater的模板文件夹（例如创建一个名为“Templates”的文件夹，路径为“Templates/”）。

### 模板1：记录睡觉时间（bed.md）

这个模板负责新建睡眠记录。它会自动处理凌晨场景，确保日期正确。

在“Templates”文件夹下创建`bed.md`文件，粘贴以下代码：

````
```javascript
<%*
// --- 配置区 ---
const sleepLogFile = "睡眠日记-2025.md"; // 你的睡眠日志路径（可自定义文件夹，如"记录/睡眠日记-2025.md"）
// --- 结束配置 ---

const now = tp.date.now();
const hour = parseInt(tp.date.now("H"));

// 关键逻辑：如果在凌晨5点前记录，日期自动算作前一天
const dateString = (hour < 5) ? tp.date.now("YYYY-MM-DD", -1) : tp.date.now("YYYY-MM-DD");
const bedTime = tp.date.now("HH:mm");

// \n确保总是在新的一行添加
const newEntry = `\n- [date:: ${dateString}], [bed:: ${bedTime}], [wake:: ]`;

const file = tp.file.find_tfile(sleepLogFile);
if (!file) {
    new Notice(`❌ 错误：找不到文件 "${sleepLogFile}"`, 5000);
    return;
}

await tp.app.vault.append(file, newEntry);
new Notice(`🛌 已记录睡觉时间: ${bedTime}`, 3000);
%>
```

### 模板2：记录起床时间（wake.md）

这个模板会扫描日志文件，找到最后一条未完成的记录，补全起床时间并计算时长。

在同一文件夹下创建`wake.md`文件，粘贴以下代码：

```javascript
<%*
// 使用一个立即执行的异步函数 (IIFE) 来确保代码的稳定性和作用域隔离
(async () => {
    // --- 配置 ---
    const filePath = '睡眠日记-2025.md'; // 你的睡眠日志文件名
    const morningCutoffHour = 5; // 早上几点前睡觉，仍算作前一天的睡眠周期
    // --- 结束配置 ---
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file) {
        new Notice(`错误：找不到文件 ${filePath}`, 5000);
        return;
    }
    try {
        const content = await this.app.vault.read(file);
        const lines = content.split('\n');
        let updated = false;
        for (let i = lines.length - 1; i >= 0; i--) {
            let line = lines[i];
            if (line.includes('[bed::') && line.includes('[wake:: ]')) {
                const match = line.match(/\[date:: (.*?)\].*\[bed:: (.*?)\]/);

                if (match && match[1] && match[2]) {
                    const dateStr = match[1]; // 这是睡眠归属的日期, e.g., "2025-08-23"
                    const bedTimeStr = match[2]; // e.g., "02:57"
                    
                    // --- 核心智能逻辑开始 ---
                    const bedHour = parseInt(bedTimeStr.split(':')[0], 10);
                    const bedDateAnchor = moment(dateStr); // 获取睡眠归属日期
                    // 如果睡觉时间在凌晨，那么它的实际日历日期是“归属日期”的后一天
                    if (bedHour < morningCutoffHour) {
                        bedDateAnchor.add(1, 'day');
                    }
                    
                    // 构建出真实的睡觉时间戳
                    const bedMoment = moment(`${bedDateAnchor.format('YYYY-MM-DD')} ${bedTimeStr}`);
                    // --- 核心智能逻辑结束 ---
                    const wakeMoment = moment(); // 获取真实的起床时间戳
                    
                    const duration = moment.duration(wakeMoment.diff(bedMoment));
                    const hours = Math.floor(duration.asHours());
                    const minutes = duration.minutes();
                    
                    const wakeTimeFormatted = wakeMoment.format('HH:mm');
                    const durationFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                    
                    const updatedLine = line.replace(
                        '[wake:: ]', 
                        `[wake:: ${wakeTimeFormatted}], [duration:: ${durationFormatted}]`
                    );
                    
                    lines[i] = updatedLine;
                    updated = true;

                    new Notice(`起床成功！🎉\n睡眠时长: ${hours} 小时 ${minutes} 分钟`, 6000);//自定义弹出信息
                    break; 
                }
            }
        }
        if (updated) {
            const newContent = lines.join('\n');
            await this.app.vault.modify(file, newContent);
        } else {
            new Notice('未找到需要更新的睡眠记录。', 5000);
        }
    } catch (error) {
        console.error("Templater 脚本 'tpl-sleep-wake' 出现错误:", error);
        new Notice("记录起床失败，请检查开发者控制台获取更多信息。", 10000);
    }
})();
%>
```

**提示**：这些脚本依赖`moment.js`（Templater内置支持）。测试时，先创建一个空的`睡眠日记-2025.md`文件，确保路径正确。

## Part 2: 配置快捷命令——一键触发自动化

现在，让这些模板变得易用。通过Templater的“Template Hotkeys”功能，我们可以将模板绑定到命令面板或热键。

1. **设置Templater模板文件夹**：
   - 打开Obsidian设置 > 社区插件 > Templater。
   - 在“Template folder location”中输入你的模板文件夹路径（如“Templates/”）。

2. **添加专用命令**（推荐，让模板直接出现在命令面板）：
   - 在Templater设置中，滚动到“Template Hotkeys”。
   - 点击“Add new”，选择模板文件（如`bed.md`），热键可选留空。
   - 重复为`wake.md`添加。
   - 现在，按Ctrl+P（或Cmd+P）打开命令面板，搜索“Templater: Insert bed”或类似，即可一键运行。

**可选**：为命令分配热键（如Ctrl+Alt+B for bed），实现真正的一键操作。

## Part 3: 数据可视化——用Dataview生成图表

最后一步：让数据“活”起来！在任何笔记中插入以下DataviewJS代码块，它会自动加载Chart.js库，生成多种图表和统计。

```dataviewjs
// --- 配置 ---
// 1. 请在这里准确填入您的睡眠记录文件名或完整路径
const FILE_PATH = "睡眠日记-2025.md";
// --- 配置结束 ---

// ------------------------------------------------------------------
// --- 核心逻辑：动态加载 Chart.js 并渲染所有内容 ---
// ------------------------------------------------------------------

// 我们把所有的数据处理和渲染，都包在一个函数里
const processAndRender = () => {
    const page = dv.page(FILE_PATH);

    if (!page || !page.file || !page.file.lists || page.file.lists.length === 0) {
        dv.paragraph("❌ **错误：** 找不到文件或文件中没有数据。");
        return; // 提前退出
    }

    // 当前日期（固定为2025-08-25，以匹配当前上下文）
    const currentDate = dv.date("2025-08-25");

    // 检测 iOS 设备
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    // 注入 CSS 样式以优化 iOS 显示
    const style = document.createElement('style');
    style.textContent = `
        .dataview.container { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
        canvas { width: 100% !important; max-height: 350px !important; }
        .sleep-record-count {
            font-size: 0.8em; /* 调整字体大小，使其看起来像小字 */
            color: var(--text-muted); /* 使用主题的柔和颜色 */
            text-align: left;
            margin-top: 15px; /* 与上方图表保持一些间距 */
        }
        @media (max-width: 600px) {
            canvas { max-height: 300px !important; }
        }
    `;
    document.head.appendChild(style);

    // 1. 数据提取和处理
    const records = page.file.lists
        .where(item => item.date && (item.duration || (item.bed && item.wake)))
        .map(item => {
            try {
                const dateStr = item.date.toString().substring(0, 10);
                let durationMillis;
                let bedtimeHour, waketimeHour;

                // 优先使用 duration 字段
                if (item.duration) {
                    const durationStr = item.duration.toString();
                    const [hours, minutes] = durationStr.split(':').map(Number);
                    if (!isNaN(hours) && !isNaN(minutes)) {
                        durationMillis = (hours * 60 + minutes) * 60 * 1000;
                    } else {
                        return null; // 无效 duration 格式
                    }
                    // 如果有 bed 和 wake，提取小时用于分布
                    if (item.bed && item.wake) {
                        const bedtime = dv.date(dateStr + "T" + item.bed.toString());
                        const waketime = dv.date(dateStr + "T" + item.wake.toString());
                        if (!bedtime || !waketime) return null;
                        bedtimeHour = bedtime.hour + bedtime.minute / 60; // 包含分钟的小数形式
                        waketimeHour = waketime.hour + waketime.minute / 60;
                    }
                } else {
                    // 没有 duration 时，使用 bed 和 wake 计算
                    const bedtimeStr = item.bed.toString();
                    const waketimeStr = item.wake.toString();
                    const bedtime = dv.date(dateStr + "T" + bedtimeStr);
                    const waketime = dv.date(dateStr + "T" + waketimeStr);
                    if (!bedtime || !waketime) return null;
                    let bedtimeMillis = bedtime.toMillis();
                    let waketimeMillis = waketime.toMillis();
                    if (waketimeMillis <= bedtimeMillis) {
                        waketimeMillis += 24 * 60 * 60 * 1000;
                    }
                    durationMillis = waketimeMillis - bedtimeMillis;
                    bedtimeHour = bedtime.hour + bedtime.minute / 60;
                    waketimeHour = waketime.hour + waketime.minute / 60;
                }

                return {
                    date: dv.date(dateStr),
                    durationMillis: durationMillis,
                    bedtimeHour: bedtimeHour, // 可能为 undefined
                    waketimeHour: waketimeHour // 可能为 undefined
                };
            } catch (e) { return null; }
        })
        .filter(item => item !== null)
        .values;

    // 我们不再使用 dv.duration()，而是创建自己的格式化函数
    const formatDurationFromMs = (ms) => {
        if (isNaN(ms) || ms < 0) return "无效时长";
        const totalMinutes = Math.round(ms / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}时 ${minutes}分`;
    };

    // 格式化平均睡眠时长为小时（小数形式，如 6.50）
    const formatAvgDurationHours = (ms) => {
        if (isNaN(ms) || ms < 0) return "无效";
        return (ms / (1000 * 60 * 60)).toFixed(2);
    };

    // 分组与计算函数
    const groupBy = (data, keyFn) => {
        return data.reduce((acc, item) => {
            const key = keyFn(item);
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {});
    };

    // 计算平均时间（使用角度平均法）
    const calculateAverages = (group) => {
        const total = group.length;
        if (total === 0) return null;

        const avgDurationMs = group.reduce((sum, r) => sum + r.durationMillis, 0) / total;

        // 计算平均入睡和起床时间（角度平均法）
        const validBedtimes = group.filter(r => r.bedtimeHour !== undefined);
        const validWaketimes = group.filter(r => r.waketimeHour !== undefined);

        const calculateMeanTime = (times) => {
            if (times.length === 0) return null;
            // 将时间（小时）转换为角度（24小时 = 360°）
            const radians = times.map(t => (t / 24) * 2 * Math.PI);
            const sinSum = radians.reduce((sum, r) => sum + Math.sin(r), 0) / times.length;
            const cosSum = radians.reduce((sum, r) => sum + Math.cos(r), 0) / times.length;
            // 计算平均角度
            let meanAngle = Math.atan2(sinSum, cosSum);
            if (meanAngle < 0) meanAngle += 2 * Math.PI;
            // 转换回小时
            let meanHours = (meanAngle / (2 * Math.PI)) * 24;
            if (meanHours >= 24) meanHours -= 24;
            // 格式化为 HH:mm
            const hours = Math.floor(meanHours);
            const minutes = Math.round((meanHours - hours) * 60);
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        };

        return {
            "记录天数": total,
            "平均入睡": calculateMeanTime(validBedtimes.map(r => r.bedtimeHour)),
            "平均起床": calculateMeanTime(validWaketimes.map(r => r.waketimeHour)),
            "平均时长": formatDurationFromMs(avgDurationMs),
            "avgDurationMs": avgDurationMs
        };
    };

    // 计算时间分布（入睡或起床）
    const calculateDistribution = (group, type) => {
        const hours = type === 'bedtime' ? group.map(r => r.bedtimeHour) : group.map(r => r.waketimeHour);
        const validHours = hours.filter(h => h !== undefined);
        const dist = {};
        validHours.forEach(h => {
            const bucket = `${String(Math.floor(h)).padStart(2, '0')}:00`;
            dist[bucket] = (dist[bucket] || 0) + 1;
        });
        return dist;
    };

    // 渲染报告
    dv.header(2, "");
    if (records.length === 0) {
        dv.paragraph("✅ 文件已找到，但未能解析出任何有效数据行。请严格检查您的数据格式是否为：`- [date:: YYYY-MM-DD], [duration:: HH:mm]` 或 `- [date:: YYYY-MM-DD], [bed:: HH:mm], [wake:: HH:mm]`");
    } else {
        // 分组并限制数据
        const yearlyData = groupBy(records, r => r.date.year);
        const monthlyData = groupBy(records, r => r.date.toFormat("yyyy-'年' MM'-月'"));

        // 限制最近12个月和12年
        const limitedMonthlyData = Object.fromEntries(
            Object.entries(monthlyData)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 12)
        );
        const limitedYearlyData = Object.fromEntries(
            Object.entries(yearlyData)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .slice(0, 12)
        );

        // 最近7天数据（从2025-08-25向前推7天）
        const sevenDaysAgo = currentDate.minus({ days: 7 });
        const recent7DaysRecords = records.filter(r => r.date >= sevenDaysAgo && r.date <= currentDate);
        const recent7DaysData = groupBy(recent7DaysRecords, r => r.date.toFormat("MM-dd"));
        const sevenDayAvg = calculateAverages(recent7DaysRecords);

        // 最近30天数据（从2025-08-25向前推30天）
        const thirtyDaysAgo = currentDate.minus({ days: 30 });
        const recent30DaysRecords = records.filter(r => r.date >= thirtyDaysAgo && r.date <= currentDate);
        const recent30DaysData = groupBy(recent30DaysRecords, r => r.date.toFormat("MM-dd"));
        const thirtyDayAvg = calculateAverages(recent30DaysRecords);

        // --- 渲染表格的模板函数 (已修改) ---
        const renderTable = (header, data) => {
            const rows = Object.keys(data).sort((a, b) => b.localeCompare(a)).map(key => {
                const avg = calculateAverages(data[key]);
                // 修改这里，去掉了 avg.记录天数
                return [avg.平均时长, avg.平均入睡 || "无数据", avg.平均起床 || "无数据", key];
            });
            // 修改这里，去掉了表头的 "记录天数"
            dv.table(["平均时长", "平均入睡", "平均起床", header], rows);
        };

        // --- 渲染平均睡眠时长柱状图的函数 ---
        const renderAvgChart = (data, title) => {
            const labels = Object.keys(data).sort((a, b) => a.localeCompare(b));
            const chartValues = labels.map(key => {
                const avg = calculateAverages(data[key]);
                return (avg.avgDurationMs / (1000 * 60 * 60)).toFixed(2);
            });
            const canvas = dv.el("canvas");
            canvas.style.width = '100%';
            canvas.style.height = '300px';
            canvas.width = window.innerWidth * window.devicePixelRatio;
            canvas.height = 300 * window.devicePixelRatio;
            dv.container.style.width = '100%';
            dv.container.appendChild(canvas);
            const chartConfig = {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${title} 平均睡眠时长 (小时)`,
                        data: chartValues,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: '小时' } },
                        x: {
                            title: { display: true, text: title === '月' ? '月份' : '年份' },
                            ticks: {
                                font: { size: isIOS ? 10 : 12 },
                                maxRotation: isIOS ? 45 : 0,
                                autoSkip: true
                            }
                        }
                    },
                    plugins: {
                        legend: { position: 'top', labels: { font: { size: isIOS ? 10 : 12 } } },
                        tooltip: { bodyFont: { size: isIOS ? 10 : 12 } }
                    },
                    animation: { duration: isIOS ? 0 : 1000 }
                }
            };
            new Chart(canvas.getContext('2d'), chartConfig);
        };

        // --- 渲染堆叠入睡/起床时间分布图（最近30天汇总） ---
        const renderStackedDistChart = (data, title, isRecent30Days = false) => {
            const allLabels = [];
            let bedtimeDist, waketimeDist;

            if (isRecent30Days) {
                // 对于最近30天，汇总所有记录的入睡和起床时间分布
                bedtimeDist = calculateDistribution(data, 'bedtime');
                waketimeDist = calculateDistribution(data, 'waketime');
                Object.keys(bedtimeDist).concat(Object.keys(waketimeDist)).forEach(bucket => {
                    if (!allLabels.includes(bucket)) allLabels.push(bucket);
                });
            } else {
                // 对于月或年，分别计算每个分组的分布
                Object.keys(data).forEach(key => {
                    const bd = calculateDistribution(data[key], 'bedtime');
                    const wd = calculateDistribution(data[key], 'waketime');
                    Object.keys(bd).concat(Object.keys(wd)).forEach(bucket => {
                        if (!allLabels.includes(bucket)) allLabels.push(bucket);
                    }
                });
            }

            const sortedLabels = allLabels.sort();
            const canvas = dv.el("canvas");
            canvas.style.width = '100%';
            canvas.style.height = '300px';
            canvas.width = window.innerWidth * window.devicePixelRatio;
            canvas.height = 300 * window.devicePixelRatio;
            dv.container.style.width = '100%';
            dv.container.appendChild(canvas);
            const chartData = {
                labels: sortedLabels,
                datasets: isRecent30Days ? [
                    {
                        label: '入睡时间',
                        data: sortedLabels.map(label => bedtimeDist[label] || 0),
                        backgroundColor: 'rgba(54, 162, 235, 0.4)',
                        stack: 'Stack 0'
                    },
                    {
                        label: '起床时间',
                        data: sortedLabels.map(label => waketimeDist[label] || 0),
                        backgroundColor: 'rgba(75, 192, 192, 0.4)',
                        stack: 'Stack 0'
                    }
                ] : [
                    ...Object.keys(data).sort((a, b) => a.localeCompare(b)).map((key, i) => ({
                        label: `${key} 入睡`,
                        data: sortedLabels.map(label => calculateDistribution(data[key], 'bedtime')[label] || 0),
                        backgroundColor: `rgba(54, 162, 235, ${0.4 - i * 0.1})`,
                        stack: `Stack ${i}`
                    })),
                    ...Object.keys(data).sort((a, b) => a.localeCompare(b)).map((key, i) => ({
                        label: `${key} 起床`,
                        data: sortedLabels.map(label => calculateDistribution(data[key], 'waketime')[label] || 0),
                        backgroundColor: `rgba(75, 192, 192, ${0.4 - i * 0.1})`,
                        stack: `Stack ${i}`
                    }))
                ]
            };
            const chartConfig = {
                type: 'bar',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                            title: { display: true, text: '时间' },
                            ticks: {
                                font: { size: isIOS ? 10 : 12 },
                                maxRotation: isIOS ? 45 : 0,
                                autoSkip: true
                            }
                        },
                        y: {
                            stacked: true,
                            title: { display: true, text: '次数' },
                            ticks: { font: { size: isIOS ? 10 : 12 } }
                        }
                    },
                    plugins: {
                        legend: { position: 'top', labels: { font: { size: isIOS ? 10 : 12 } } },
                        tooltip: { bodyFont: { size: isIOS ? 10 : 12 } }
                    },
                    animation: { duration: isIOS ? 0 : 1000 }
                }
            };
            new Chart(canvas.getContext('2d'), chartConfig);
        };

        // --- 渲染睡眠时长趋势折线图（7天或30天） ---
        const renderTrendChart = (data, title, days) => {
            const labels = Object.keys(data).sort((a, b) => a.localeCompare(b));
            const chartValues = labels.map(key => {
                const avg = calculateAverages(data[key]);
                return (avg.avgDurationMs / (1000 * 60 * 60)).toFixed(2);
            });
            const canvas = dv.el("canvas");
            canvas.style.width = '100%';
            canvas.style.height = '300px';
            canvas.width = window.innerWidth * window.devicePixelRatio;
            canvas.height = 300 * window.devicePixelRatio;
            dv.container.style.width = '100%';
            dv.container.appendChild(canvas);
            const chartConfig = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${title} 睡眠时长趋势 (小时)`,
                        data: chartValues,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: '小时' },
                            ticks: { font: { size: isIOS ? 10 : 12 } }
                        },
                        x: {
                            title: { display: true, text: '日期' },
                            ticks: {
                                font: { size: isIOS ? 10 : 12 },
                                maxRotation: isIOS ? 45 : 0,
                                autoSkip: days === 7 ? false : true // 7天显示所有标签
                            }
                        }
                    },
                    plugins: {
                        legend: { position: 'top', labels: { font: { size: isIOS ? 10 : 12 } } },
                        tooltip: { bodyFont: { size: isIOS ? 10 : 12 } }
                    },
                    animation: { duration: isIOS ? 0 : 1000 }
                }
            };
            new Chart(canvas.getContext('2d'), chartConfig);
        };

        // --- 按顺序渲染所有内容 ---
        dv.header(3, "");
        dv.header(4, `近7天睡眠趋势 平均: ${sevenDayAvg ? formatAvgDurationHours(sevenDayAvg.avgDurationMs) : '无数据'}小时`);
        renderTrendChart(recent7DaysData, "近7天", 7);

        dv.header(3, "");
        dv.header(4, `最近30天睡眠时长趋势 平均: ${thirtyDayAvg ? formatAvgDurationHours(thirtyDayAvg.avgDurationMs) : '无数据'}小时`);
        renderTrendChart(recent30DaysData, "最近30天", 30);
        dv.header(4, "最近30天入睡/起床时间分布 (堆叠)");
        renderStackedDistChart(recent30DaysRecords, "最近30天", true);

        dv.header(3, "按月统计");
        renderTable("月份", limitedMonthlyData);
        renderAvgChart(limitedMonthlyData, "月");

        dv.header(3, "按年统计");
        renderTable("年份", limitedYearlyData);
        renderAvgChart(limitedYearlyData, "年");
        dv.header(4, "本年入睡/起床时间分布 (堆叠)");
        renderStackedDistChart(limitedYearlyData, "年");
        dv.header(4, "本年睡眠时长趋势");
        renderTrendChart(limitedYearlyData, "年", 365);

        // --- 新增：在最下方显示总记录条数 ---
        dv.el('p', `🛌 睡眠记录共 ${records.length} 条`, { cls: 'sleep-record-count' });
    }
};

// ------------------------------------------------------------------
// --- 动态加载脚本的逻辑 ---
// ------------------------------------------------------------------

const loadScripts = () => {
    return new Promise((resolve, reject) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }

        const chartScript = document.createElement('script');
        chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
        document.head.appendChild(chartScript);

        chartScript.onload = () => resolve();
        chartScript.onerror = () => reject(new Error("无法加载 Chart.js 库"));
    });
};

loadScripts()
    .then(() => {
        processAndRender();
    })
    .catch((error) => {
        dv.paragraph(`⚠️ **错误：** ${error.message}。图表可能不可用，但表格将继续显示。`);
        processAndRender();
    });
```
````

**提示**：代码会从CDN加载Chart.js，确保你的Obsidian有网络权限。如果图表不显示，检查文件路径和数据格式。

## 结语

恭喜！你现在拥有了一套完整的Obsidian睡眠自动化系统。从手动记录的烦恼，到一键操作和智能图表的便利，这不仅仅是工具，更是生活优化的一部分。我的6小时调试经历，就是为了让你避开所有坑，直接上手。如果你遇到问题，欢迎在评论区交流——或许我们能一起完善它。

作为新手博主，我希望这篇文章能帮助更多人。如果你喜欢，分享给朋友吧！未来，我计划录制视频教程，进一步传播这个idea。感谢阅读，下次见！

