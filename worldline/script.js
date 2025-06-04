document.addEventListener('DOMContentLoaded', () => {
    const mermaidGraphDiv = document.getElementById('mermaid-graph');

    // --- 辅助函数：主题切换 ---
    function applyTheme(themeName) {
        document.body.className = ''; // 移除所有现有主题类
        if (themeName && themeName !== 'default') {
            document.body.classList.add(`theme-${themeName}`);
        }
        // 注意：worldline页面不保存主题，只应用editor页面保存的主题
    }

    // 从 localStorage 加载 storyData
    const storedStoryData = localStorage.getItem('interactiveStoryData');
    let storyData = null;

    if (storedStoryData) {
        try {
            storyData = JSON.parse(storedStoryData);
        } catch (error) {
            console.error('解析 storyData 失败:', error);
            mermaidGraphDiv.innerHTML = '<p style="color: red;">加载小说数据失败。</p>';
            return;
        }
    } else {
        mermaidGraphDiv.innerHTML = '<p>没有找到小说数据。请从编辑器页面加载或保存小说。</p>';
        return;
    }

    // 构建Mermaid图表语法
    let mermaidSyntax = "graph TD\n";
    if (Object.keys(storyData.scenes).length === 0) {
        mermaidSyntax += "    A[无场景]\n";
    } else {
        for (const sceneId in storyData.scenes) {
            const scene = storyData.scenes[sceneId];
            // 场景节点只显示ID
            mermaidSyntax += `    ${scene.id}("${scene.id}")\n`;

            // 选项连接
            if (scene.choices && scene.choices.length > 0) {
                scene.choices.forEach(choice => {
                    if (choice.targetSceneId) {
                        const choiceText = choice.text.replace(/"/g, '"'); // 选项文本中的双引号需要转义为HTML实体
                        mermaidSyntax += `    ${scene.id} -- "${choiceText}" --> ${choice.targetSceneId}\n`;
                    }
                });
            }
        }
        // 尝试添加结局节点，如果结局有对应的场景ID
        if (storyData.endings && storyData.endings.length > 0) {
            storyData.endings.forEach((ending, index) => {
                const endingNodeId = `Ending${index + 1}`;
                mermaidSyntax += `    ${endingNodeId}[结局${index + 1}]\n`;
                if (ending.sceneId && storyData.scenes[ending.sceneId]) {
                    mermaidSyntax += `    ${ending.sceneId} --> ${endingNodeId}\n`;
                }
            });
        }
    }

    // 清空并渲染Mermaid图表
    mermaidGraphDiv.innerHTML = ''; // 清空旧内容
    mermaid.render('graphDiv', mermaidSyntax).then(({ svg, bindFunctions }) => {
        mermaidGraphDiv.innerHTML = svg;
        if (bindFunctions) {
            bindFunctions();
        }

        // 初始化 svg-pan-zoom
        const svgElement = mermaidGraphDiv.querySelector('svg');
        if (svgElement) {
            if (typeof window.svgPanZoom === 'function') {
                window.svgPanZoom(svgElement, {
                    zoomEnabled: true,
                    controlIconsEnabled: true, // 显示控制图标（放大、缩小、重置）
                    fit: true, // 初始时适应容器
                    center: true, // 初始时居中
                    minZoom: 0.1, // 最小缩放比例
                    maxZoom: 10 // 最大缩放比例
                });
            } else {
                console.error('svgPanZoom is not defined. Please ensure svg-pan-zoom.min.js is loaded correctly.');
                // 如果 svgPanZoom 未定义，可以显示一个提示
                const zoomErrorDiv = document.createElement('div');
                zoomErrorDiv.style.color = 'red';
                zoomErrorDiv.textContent = '缩放功能加载失败，请检查网络或浏览器控制台。';
                mermaidGraphDiv.appendChild(zoomErrorDiv);
            }
        }
    }).catch(error => {
        mermaidGraphDiv.innerHTML = `<p style="color: red;">图表渲染失败: ${error.message}</p>`;
        console.error("Mermaid渲染失败:", error);
    });

    // 在页面加载时应用保存的主题
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    applyTheme(savedTheme);
});
