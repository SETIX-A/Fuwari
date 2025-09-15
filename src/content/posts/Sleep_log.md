---
title: Obsidian 睡眠自动化终极指南：一键追踪与可视化
published: 2025-09-08
description: 告别繁琐的手动记录，用一个智能脚本和动态图表，将你的Obsidian打造成睡眠分析中心。
tags:
  - Obsidian
  - Automation
  - Dataview
  - Templater
  - Life-Hack
category: Obsidian
draft: false
---

大家好！如果你也在为记录睡眠时间而烦恼——每天手动输入、计算时长，还得费力地分析数据——那么这篇文章就是为你量身打造的。我曾经花了数小时踩遍了各种坑，最终搭建出这套**“智能”**的Obsidian睡眠追踪系统。

现在，我将一步步带你实现它。只需15分钟，你就能享受到**“一个按键，搞定睡觉、起床与失眠修正”**的极致便利，以及自动生成的精美睡眠数据可视化图表。

为什么选择Obsidian？它免费、开源、支持插件扩展，能将你的笔记库转化为强大的个人数据管理系统。跟随我的指南，你将学会如何真正让工具为你服务。准备好了吗？让我们开始吧！

## 最终效果预览

想象一下这样的场景：
1.  **晚上准备睡觉时**：按一个快捷键，系统自动在你的睡眠日记中添加一行记录，如 `- [date:: 2025-09-08], [bed:: 23:58], [wake:: ]`。它甚至能智能判断凌晨睡觉（例如凌晨3点），并将日期归为前一天。
2.  **失眠或晚睡时**：上床后过了1、2个小时才睡着？没关系，再次按下**同一个快捷键**，系统会自动判断时间差过短，将你的入睡时间**静默修正**为当前时间。
3.  **早上起床时**：再次按下**同一个快捷键**，系统会自动判断你已睡了足够长的时间，找到昨晚的记录，补全起床时间，并精确计算出睡眠时长，如 `- [date:: 2025-09-08], [bed:: 23:58], [wake:: 08:15], [duration:: 08:17]`。
4.  **数据可视化**：在任意笔记中，都能看到自动生成的睡眠时长趋势图、平均入睡/起床时间分布图，以及按月/年统计表格。所有数据实时更新，一目了然。

这不仅仅是记录，更是帮助你优化睡眠、提升生活质量的强大工具。

:::tip[注意]
**以下是演示图**
:::
![示例图片](src/assets/images/sleep-1.jpeg "IOS预览如下")

## 所需工具

- **[Obsidian](https://obsidian.md/)**（免费下载自官网）。
- **插件**（在Obsidian设置 > 社区插件中安装并启用）：
  - **Templater**：核心插件，用于运行我们的“智能脚本”，实现自动化记录。
  - **Dataview**：用于查询数据并生成图表，支持动态可视化。

安装插件后，重启Obsidian以确保生效。

## Part 1: 配置唯一的“智能睡眠”模板

我们将抛弃繁琐的“睡觉/起床”双脚本模式，用一个**统一的、智能的**模板来处理所有场景。

首先，在Obsidian设置中配置Templater的模板文件夹（例如创建一个名为“Templates”的文件夹）。

### 智能睡眠脚本 (Smart-Sleep.md)

在你的模板文件夹下创建`Smart-Sleep.md`文件，粘贴以下**完整代码**：

```javascript
<%*
// --- 智能睡眠日志 V2.1 (自动修正版) ---

// --- ⚙️ 配置区 ---
const filePath = "睡眠日记-2025.md"; // 你的睡眠日志文件名（可自定义文件夹，如"6-记录/睡眠/睡眠日记-2025.md"）
const morningCutoffHour = 5; // 早上5点前睡觉，仍算作前一天的睡眠周期
const insomniaThresholdHours = 4; // 上床后4小时内再次触发，将自动修正入睡时间
// --- 结束配置 ---

// --- 核心功能 ---
const file = tp.file.find_tfile(filePath);
if (!file) {
    new Notice(`❌ 错误：找不到文件 "${filePath}"`, 5000);
    return;
}
const content = await app.vault.read(file);
const lines = content.trim().split('\n');
const lastLine = lines[lines.length - 1] || "";

if (lastLine.includes('[bed::') && lastLine.includes('[wake:: ]')) {
    await handleUnfinishedSleep(lastLine, lines.length - 1);
} else {
    await recordBedTime();
}

// --- 函数定义 ---
async function handleUnfinishedSleep(line, lineIndex) {
    const bedMoment = getBedMoment(line);
    if (!bedMoment) return;
    
    const nowMoment = moment();
    const durationSinceBed = moment.duration(nowMoment.diff(bedMoment));

    if (durationSinceBed.asHours() <= insomniaThresholdHours) {
        await correctBedTime(line, lineIndex, nowMoment);
    } else {
        await recordWakeUp(line, lineIndex, bedMoment, nowMoment);
    }
}

async function recordBedTime() {
    const now = tp.date.now();
    const hour = parseInt(tp.date.now("H"));
    const dateString = (hour < morningCutoffHour) ? tp.date.now("YYYY-MM-DD", -1) : tp.date.now("YYYY-MM-DD");
    const bedTime = tp.date.now("HH:mm");
    const newEntry = `\n- [date:: ${dateString}], [bed:: ${bedTime}], [wake:: ]`;
    
    await app.vault.append(file, newEntry);
    new Notice(`🛌 已记录上床时间: ${bedTime}`, 3000);
}

async function recordWakeUp(line, lineIndex, bedMoment, wakeMoment) {
    const duration = moment.duration(wakeMoment.diff(bedMoment));
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    
    const wakeTimeFormatted = wakeMoment.format('HH:mm');
    const durationFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    const updatedLine = line.replace('[wake:: ]', `[wake:: ${wakeTimeFormatted}], [duration:: ${durationFormatted}]`);
    
    lines[lineIndex] = updatedLine;
    await app.vault.modify(file, lines.join('\n'));
    new Notice(`起床成功！🎉\n睡眠时长: ${hours} 小时 ${minutes} 分钟`, 6000);
}

async function correctBedTime(line, lineIndex, newBedMoment) {
    const newBedTime = newBedMoment.format("HH:mm");
    const updatedLine = line.replace(/(\[bed:: )(\d{2}:\d{2})(\])/, `$1${newBedTime}$3`);

    lines[lineIndex] = updatedLine;
    await app.vault.modify(file, lines.join('\n'));
    new Notice(`⏰ 已将入睡时间自动修正为: ${newBedTime}`, 4000);
}

function getBedMoment(line) {
    const match = line.match(/\[date:: (.*?)\].*\[bed:: (.*?)\]/);
    if (!match || !match || !match) {
        new Notice("❌ 错误：无法解析最新的睡眠记录。", 5000);
        return null;
    }
    const dateStr = match;
    const bedTimeStr = match;
    
    const bedHour = parseInt(bedTimeStr.split(':'), 10);
    const bedDateAnchor = moment(dateStr, "YYYY-MM-DD");
    
    if (bedHour < morningCutoffHour) {
        bedDateAnchor.add(1, 'day');
    }
    
    return moment(`${bedDateAnchor.format('YYYY-MM-DD')} ${bedTimeStr}`, "YYYY-MM-DD HH:mm");
}
%>
```

**提示**：测试前，先在你的仓库根目录创建一个空的`睡眠日记-2025.md`文件，确保路径正确。

### 模板2：创建你的日志文件 (睡眠日记-2025.md)

这个文件既是你的原始数据存储地，也是一个快速预览和导航的入口。

````markdown
```dataviewjs
// --- 配置区 ---
const displayCount = 5; // 定义显示的行数，可任意修改！
// --- 配置区结束 ---

const currentPage = dv.current();
if (currentPage && currentPage.file.lists.length > 0) {
    const recordCount = currentPage.file.lists.length;
    dv.paragraph(`🛌 睡眠记录共有 **${recordCount}** 条`);
    
    const clickableHeader = dv.el("h3", "最近记录 ⏬");
    clickableHeader.style.cursor = "pointer"; 
    clickableHeader.onclick = () => {
        let scrollableContainer = dv.container;
        while (scrollableContainer && scrollableContainer.scrollHeight <= scrollableContainer.clientHeight) {
            scrollableContainer = scrollableContainer.parentElement;
        }
        if (scrollableContainer) {
            scrollableContainer.scrollTo({ top: scrollableContainer.scrollHeight, behavior: 'smooth' });
        }
    };
    
    const recentRecords = currentPage.file.lists.slice(-displayCount);
    dv.list(recentRecords.map(item => item.text));
} else {
    dv.paragraph("❌ 暂无睡眠记录数据。");
}
```

- [date:: 2025-08-01], [bed:: 23:30], [wake:: 09:50], [duration:: 10:20]（这是格式示例，你不用手动输入）
````

:::caution[重要事项]
请确保你的**智能睡眠脚本**和**数据可视化报告**（见Part 3）顶部的`filePath`路径，与你这个日志文件的**真实路径和文件名**完全一致！这是整个系统能运作起来的关键。
:::

---

## Part 2: 配置快捷命令——一键触发所有操作

让这个智能脚本变得易用。我们将为它绑定一个命令和快捷键。

1. **设置Templater模板文件夹**：
   - 打开Obsidian设置 > 社区插件 > Templater。
   - 在“Template folder location”中输入你的模板文件夹路径（如“Templates/”）。

2. **添加快捷命令**：
   - 在Templater设置中，滚动到“Template Hotkeys”。
   - 点击“Add new”，选择我们创建的`Smart-Sleep.md`模板。
   - **为它分配一个你喜欢的快捷键**（如`⌥+S`），实现真正的一键操作。
   - 现在，按`⌘+P`打开命令面板，搜索“Templater: Insert Smart-Sleep”，或直接按你的快捷键，即可运行脚本。

:::tip[提示]
你可以前往“设置”>“命令面板”，使用置顶功能，让你的睡眠命令永远出现在最前面。
:::
![示例图片](src/assets/images/sleep-2.jpg "命令面板")

## Part 3: 数据可视化——用Dataview生成图表

最后一步：让数据“活”起来！在你的主页或任何笔记中插入以下DataviewJS代码块，它会自动生成多种图表和统计。

<details>
<summary style="color: #4CAF50; font-weight: bold; cursor: pointer;">📊 点击查看/折叠睡眠统计报告代码</summary>

&#x60;&#x60;&#x60;
```dataviewjs
// --- 配置 ---
const FILE_PATH = "睡眠日记-2025.md"; // 确保此路径与你的日志文件完全一致！
// --- 配置结束 ---

// --- 辅助函数与常量 ---
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const formatDurationFromMs = (ms) => {
    if (isNaN(ms) || ms < 0) return "无效时长";
    const totalMinutes = Math.round(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}时 ${minutes}分`;
};
const formatAvgDurationHours = (ms) => {
    if (isNaN(ms) || ms < 0) return "无效";
    return (ms / (1000 * 60 * 60)).toFixed(2);
};
const groupBy = (data, keyFn) => {
    return data.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
};
const calculateAverages = (group) => {
    const total = group.length;
    if (total === 0) return null;
    const avgDurationMs = group.reduce((sum, r) => sum + r.durationMillis, 0) / total;

    const calculateMeanTime = (times) => {
        if (times.length === 0) return null;
        const radians = times.map(t => (t / 24) * 2 * Math.PI);
        const sinSum = radians.reduce((sum, r) => sum + Math.sin(r), 0) / times.length;
        const cosSum = radians.reduce((sum, r) => sum + Math.cos(r), 0) / times.length;
        let meanAngle = Math.atan2(sinSum, cosSum);
        if (meanAngle < 0) meanAngle += 2 * Math.PI;
        let meanHours = (meanAngle / (2 * Math.PI)) * 24;
        const hours = Math.floor(meanHours);
        const minutes = Math.round((meanHours - hours) * 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    return {
        "记录天数": total,
        "平均入睡": calculateMeanTime(group.filter(r => r.bedtimeHour !== undefined).map(r => r.bedtimeHour)),
        "平均起床": calculateMeanTime(group.filter(r => r.waketimeHour !== undefined).map(r => r.waketimeHour)),
        "平均时长": formatDurationFromMs(avgDurationMs),
        "avgDurationMs": avgDurationMs
    };
};
// --- 1. 数据解析模块 ---
function parseSleepData(page) {
    if (!page || !page.file || !page.file.lists || page.file.lists.length === 0) {
        dv.paragraph("❌ **错误：** 找不到文件或文件中没有数据。");
        return null;
    }
    return page.file.lists
        .where(item => item.date && (item.duration || (item.bed && item.wake)))
        .map(item => {
            try {
                const dateStr = item.date.toString().substring(0, 10);
                let durationMillis, bedtimeHour, waketimeHour;

                if (item.duration) {
                    const [hours, minutes] = item.duration.toString().split(':').map(Number);
                    if (isNaN(hours) || isNaN(minutes)) return null;
                    durationMillis = (hours * 60 + minutes) * 60 * 1000;
                } else {
                    const bedtime = dv.date(`${dateStr}T${item.bed}`);
                    let waketime = dv.date(`${dateStr}T${item.wake}`);
                    if (!bedtime || !waketime) return null;
                    if (waketime <= bedtime) waketime = waketime.plus({ days: 1 });
                    durationMillis = waketime.toMillis() - bedtime.toMillis();
                }

                if (item.bed) {
                    const bedtime = dv.date(`${dateStr}T${item.bed}`);
                    if (bedtime) bedtimeHour = bedtime.hour + bedtime.minute / 60;
                }
                if (item.wake) {
                    const waketime = dv.date(`${dateStr}T${item.wake}`);
                    if (waketime) waketimeHour = waketime.hour + waketime.minute / 60;
                }

                return { date: dv.date(dateStr), durationMillis, bedtimeHour, waketimeHour };
            } catch (e) {
                console.warn(`[DataviewJS Sleep Report] 解析数据失败，已跳过此行: ${item.text}`, e);
                return null;
            }
        })
        .filter(item => item !== null && !isNaN(item.durationMillis))
        .values;
}
// --- 2. 核心统计计算模块 ---
function calculateAllStatistics(records) {
    const today = dv.date('now').startOf('day');
    const sevenDaysAgo = today.minus({ days: 7 }); 
    const thirtyDaysAgo = today.minus({ days: 30 }); 

    const stats = {
        recent7DaysRecords: [],
        recent30DaysRecords: [],
        byMonth: {},
        byYear: {},
        totalRecords: records.length,
    };

    for (const record of records) {
        const recordDate = record.date; 
        if (recordDate.ts >= thirtyDaysAgo.ts && recordDate.ts <= today.ts) {
            stats.recent30DaysRecords.push(record);
            if (recordDate.ts >= sevenDaysAgo.ts) {
                stats.recent7DaysRecords.push(record);
            }
        }
        const monthKey = recordDate.toFormat("yyyy-'年' MM'-月'");
        if (!stats.byMonth[monthKey]) stats.byMonth[monthKey] = [];
        stats.byMonth[monthKey].push(record);

        const yearKey = recordDate.year;
        if (!stats.byYear[yearKey]) stats.byYear[yearKey] = [];
        stats.byYear[yearKey].push(record);
    }

    stats.sevenDayAvg = calculateAverages(stats.recent7DaysRecords);
    stats.thirtyDayAvg = calculateAverages(stats.recent30DaysRecords);
    stats.recent7DaysGrouped = groupBy(stats.recent7DaysRecords, r => r.date.toFormat("MM-dd"));
    stats.recent30DaysGrouped = groupBy(stats.recent30DaysRecords, r => r.date.toFormat("MM-dd"));
    stats.limitedMonthlyData = Object.fromEntries(Object.entries(stats.byMonth).sort((a, b) => b.localeCompare(a)).slice(0, 12));
    stats.limitedYearlyData = Object.fromEntries(Object.entries(stats.byYear).sort((a, b) => b.localeCompare(a)).slice(0, 12));

    return stats;
}
// --- 3. 报告渲染模块 ---
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
const renderTable = (header, data) => {
    const rows = Object.keys(data).sort((a, b) => b.localeCompare(a)).map(key => {
        const avg = calculateAverages(data[key]);
        return [avg.平均时长, avg.平均入睡 || "无数据", avg.平均起床 || "无数据", key];
    });
    dv.table(["平均时长", "平均入睡", "平均起床", header], rows);
};
const createChartCanvas = () => {
    const canvas = dv.el("canvas");
    canvas.style.width = '100%'; canvas.style.height = '300px';
    canvas.width = window.innerWidth * window.devicePixelRatio; canvas.height = 300 * window.devicePixelRatio;
    dv.container.appendChild(canvas);
    return canvas.getContext('2d');
};
const renderAvgChart = (data, title) => {
    const labels = Object.keys(data).sort((a, b) => a.localeCompare(b));
    const chartValues = labels.map(key => (calculateAverages(data[key]).avgDurationMs / (1000 * 60 * 60)).toFixed(2));
    const ctx = createChartCanvas();
    new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: `${title} 平均睡眠时长 (小时)`, data: chartValues, backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgba(54, 162, 235, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: '小时' } } }, animation: { duration: IS_IOS ? 0 : 1000 } } });
};
const renderTrendChart = (data, title, days) => {
    const labels = Object.keys(data).sort((a, b) => a.localeCompare(b));
    const chartValues = labels.map(key => formatAvgDurationHours(calculateAverages(data[key]).avgDurationMs));
    const ctx = createChartCanvas();
    new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: `${title} 睡眠时长趋势 (小时)`, data: chartValues, backgroundColor: 'rgba(255, 99, 132, 0.2)', borderColor: 'rgba(255, 99, 132, 1)', borderWidth: 2, fill: false, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, title: { display: true, text: '小时' } } }, animation: { duration: IS_IOS ? 0 : 1000 } } });
};
const renderStackedDistChart = (data, title) => {
    const bedtimeDist = calculateDistribution(data, 'bedtime');
    const waketimeDist = calculateDistribution(data, 'waketime');
    const allLabels = [...new Set([...Object.keys(bedtimeDist), ...Object.keys(waketimeDist)])].sort();
    const ctx = createChartCanvas();
    new Chart(ctx, { type: 'bar', data: { labels: allLabels, datasets: [{ label: '入睡时间', data: allLabels.map(label => bedtimeDist[label] || 0), backgroundColor: 'rgba(54, 162, 235, 0.4)', stack: 'Stack 0' }, { label: '起床时间', data: allLabels.map(label => waketimeDist[label] || 0), backgroundColor: 'rgba(75, 192, 192, 0.4)', stack: 'Stack 0' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } }, animation: { duration: IS_IOS ? 0 : 1000 } } });
};
function renderReport(stats) {
    if (stats.totalRecords === 0) {
        dv.paragraph("✅ 文件已找到，但未能解析出任何有效数据行。请检查数据格式。");
        return;
    }
    dv.header(4, `近7天睡眠趋势 平均: ${stats.sevenDayAvg ? formatAvgDurationHours(stats.sevenDayAvg.avgDurationMs) : '无数据'}小时`);
    renderTrendChart(stats.recent7DaysGrouped, "近7天", 7);
    dv.header(4, `最近30天睡眠时长趋势 平均: ${stats.thirtyDayAvg ? formatAvgDurationHours(stats.thirtyDayAvg.avgDurationMs) : '无数据'}小时`);
    renderTrendChart(stats.recent30DaysGrouped, "最近30天", 30);
    dv.header(4, "最近30天入睡/起床时间分布");
    renderStackedDistChart(stats.recent30DaysRecords, "最近30天");
    dv.header(3, "按月统计");
    renderTable("月份", stats.limitedMonthlyData);
    renderAvgChart(stats.limitedMonthlyData, "月");
    dv.header(3, "按年统计");
    renderTable("年份", stats.limitedYearlyData);
    renderAvgChart(stats.limitedYearlyData, "年");
    dv.el('p', `🛌 睡眠记录共 ${stats.totalRecords} 条`, { cls: 'sleep-record-count' });
}
// --- 主执行逻辑 ---
const main = () => {
    const style = document.createElement('style');
    style.textContent = `
        .dataview.container { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
        canvas { width: 100% !important; max-height: 350px !important; }
        .sleep-record-count { font-size: 0.8em; color: var(--text-muted); text-align: left; margin-top: 15px; }
        @media (max-width: 600px) { canvas { max-height: 300px !important; } }
    `;
    document.head.appendChild(style);
    const page = dv.page(FILE_PATH);
    const records = parseSleepData(page);
    if (records) {
        const statistics = calculateAllStatistics(records);
        renderReport(statistics);
    }
};
if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    document.head.appendChild(script);
    script.onload = main;
    script.onerror = () => dv.paragraph("❌ 无法加载 Chart.js 库，图表无法显示。");
} else {
    main();
}
```
&#x60;&#x60;&#x60;

</details>

**提示**：代码会从CDN加载Chart.js，确保你的Obsidian有网络权限。如果图表不显示，检查文件路径和数据格式。

## 结语

恭喜！你现在拥有了一套完整的Obsidian睡眠自动化系统。从手动记录的烦恼，到一键操作和智能图表的便利，这不仅仅是工具，更是生活优化的一部分。我的6小时调试经历，就是为了让你避开所有坑，直接上手。如果你遇到问题，欢迎在评论区交流——或许我们能一起完善它。

作为新手博主，我希望这篇文章能帮助更多人。如果你喜欢，分享给朋友吧！未来，我计划录制视频教程，进一步传播这个idea。

:::note[✨ ​**使用提示**​ ✨]

> 以上代码是一个纯粹的本地化数据查询，所有数据处理都在你自己的设备上完成。
> 
> ​**最关键的一点：它不会将你的任何数据上传到任何服务器！​**​

如果你遇到了程序错误，或者灵光一现有了超棒的想法，随时欢迎告诉我！

📧 邮件：[Socrates.02zx@Gmail.com](mailto:Socrates.02zx@Gmail.com)

感谢阅读，下次见！:)
:::