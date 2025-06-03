document.addEventListener('DOMContentLoaded', () => {
    const sceneList = document.getElementById('scene-list');
    const addSceneBtn = document.getElementById('add-scene-btn');
    const sceneIdInput = document.getElementById('scene-id');
    const sceneTextInput = document.getElementById('scene-text');
    const choicesContainer = document.getElementById('choices-container');
    const addChoiceBtn = document.getElementById('add-choice-btn');
    const saveBtn = document.getElementById('save-btn');
    const loadBtn = document.getElementById('load-btn');
    const previewBtn = document.getElementById('preview-btn');

    let storyData = {
        title: "新互动小说",
        startSceneId: "",
        scenes: {},
        endings: []
    };

    let currentSceneId = null;

    // --- 辅助函数 ---
    function generateUniqueId(prefix) {
        return prefix + Date.now() + Math.floor(Math.random() * 1000);
    }

    function renderSceneList() {
        sceneList.innerHTML = '';
        for (const id in storyData.scenes) {
            const scene = storyData.scenes[id];
            const li = document.createElement('li');
            li.dataset.sceneId = id;
            li.textContent = scene.text.substring(0, 30) + '... (ID: ' + id + ')';
            if (id === currentSceneId) {
                li.classList.add('active');
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡到li，避免触发场景选择
                deleteScene(id);
            });
            li.appendChild(deleteBtn);

            li.addEventListener('click', () => selectScene(id));
            sceneList.appendChild(li);
        }
    }

    function selectScene(id) {
        currentSceneId = id;
        const scene = storyData.scenes[id];
        if (scene) {
            sceneIdInput.value = scene.id;
            sceneTextInput.value = scene.text;
            renderChoices(scene.choices);
            // 移除所有active类
            document.querySelectorAll('#scene-list li').forEach(item => item.classList.remove('active'));
            // 给当前选中的场景添加active类
            document.querySelector(`[data-scene-id="${id}"]`).classList.add('active');
        }
    }

    function renderChoices(choices) {
        choicesContainer.innerHTML = '';
        choices.forEach((choice, index) => {
            const choiceDiv = document.createElement('div');
            choiceDiv.classList.add('choice-item');
            choiceDiv.innerHTML = `
                <label>选项文本:</label>
                <input type="text" class="choice-text" value="${choice.text || ''}">
                <label>目标场景ID:</label>
                <input type="text" class="choice-target-scene-id" value="${choice.targetSceneId || ''}">
                <button class="delete-choice-btn">删除选项</button>
            `;
            choiceDiv.querySelector('.delete-choice-btn').addEventListener('click', () => {
                deleteChoice(index);
            });
            choicesContainer.appendChild(choiceDiv);
        });
    }

    function updateCurrentSceneFromEditor() {
        if (!currentSceneId || !storyData.scenes[currentSceneId]) {
            return;
        }

        const oldSceneId = currentSceneId;
        const newSceneId = sceneIdInput.value.trim();
        const scene = storyData.scenes[oldSceneId];

        // 处理场景ID变更
        if (newSceneId !== oldSceneId) {
            if (!newSceneId) {
                alert('场景ID不能为空！');
                sceneIdInput.value = oldSceneId; // 恢复旧ID
                return;
            }
            if (storyData.scenes[newSceneId] && newSceneId !== oldSceneId) {
                alert('场景ID "' + newSceneId + '" 已存在，请使用其他ID。');
                sceneIdInput.value = oldSceneId; // 恢复旧ID
                return;
            }

            // 更新 storyData.scenes 中的键
            storyData.scenes[newSceneId] = { ...scene, id: newSceneId };
            delete storyData.scenes[oldSceneId];

            // 更新所有引用旧ID的 targetSceneId
            for (const sId in storyData.scenes) {
                storyData.scenes[sId].choices.forEach(choice => {
                    if (choice.targetSceneId === oldSceneId) {
                        choice.targetSceneId = newSceneId;
                    }
                });
            }

            // 更新起始场景ID
            if (storyData.startSceneId === oldSceneId) {
                storyData.startSceneId = newSceneId;
            }

            currentSceneId = newSceneId; // 更新当前选中ID
        }

        // 更新场景文本和选项
        scene.text = sceneTextInput.value;
        scene.choices = [];
        document.querySelectorAll('.choice-item').forEach(choiceDiv => {
            const text = choiceDiv.querySelector('.choice-text').value;
            const targetSceneId = choiceDiv.querySelector('.choice-target-scene-id').value;
            scene.choices.push({ text, targetSceneId });
        });

        renderSceneList(); // 更新场景列表显示
    }

    // --- 事件处理函数 ---
    addSceneBtn.addEventListener('click', () => {
        let newSceneId = prompt('请输入新场景的ID:');
        if (!newSceneId) {
            alert('场景ID不能为空！');
            return;
        }
        newSceneId = newSceneId.trim();
        if (storyData.scenes[newSceneId]) {
            alert('场景ID "' + newSceneId + '" 已存在，请使用其他ID。');
            return;
        }

        storyData.scenes[newSceneId] = {
            id: newSceneId,
            text: '新场景内容...',
            choices: []
        };
        if (!storyData.startSceneId) {
            storyData.startSceneId = newSceneId; // 如果没有起始场景，则设置为第一个场景
        }
        renderSceneList();
        selectScene(newSceneId);
    });

    function deleteScene(id) {
        if (confirm('确定要删除此场景吗？')) {
            delete storyData.scenes[id];
            if (currentSceneId === id) {
                currentSceneId = null;
                sceneIdInput.value = '';
                sceneTextInput.value = '';
                choicesContainer.innerHTML = '';
            }
            if (storyData.startSceneId === id) {
                storyData.startSceneId = Object.keys(storyData.scenes)[0] || ''; // 如果删除了起始场景，重新指定
            }
            renderSceneList();
        }
    }

    addChoiceBtn.addEventListener('click', () => {
        if (currentSceneId && storyData.scenes[currentSceneId]) {
            storyData.scenes[currentSceneId].choices.push({
                text: '新选项',
                targetSceneId: ''
            });
            renderChoices(storyData.scenes[currentSceneId].choices);
        } else {
            alert('请先选择一个场景来添加选项。');
        }
    });

    function deleteChoice(index) {
        if (currentSceneId && storyData.scenes[currentSceneId]) {
            storyData.scenes[currentSceneId].choices.splice(index, 1);
            renderChoices(storyData.scenes[currentSceneId].choices);
        }
    }

    // 监听场景内容和选项的变化，实时更新数据
    sceneTextInput.addEventListener('input', updateCurrentSceneFromEditor);
    choicesContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('choice-text') || e.target.classList.contains('choice-target-scene-id')) {
            updateCurrentSceneFromEditor();
        }
    });


    saveBtn.addEventListener('click', () => {
        updateCurrentSceneFromEditor(); // 确保最新数据已保存到storyData
        const jsonString = JSON.stringify(storyData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = storyData.title + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('小说已保存！');
    });

    loadBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = event => {
                try {
                    storyData = JSON.parse(event.target.result);
                    if (!storyData.scenes || typeof storyData.scenes !== 'object') {
                        throw new Error("Invalid story format: 'scenes' missing or not an object.");
                    }
                    if (!storyData.startSceneId && Object.keys(storyData.scenes).length > 0) {
                        storyData.startSceneId = Object.keys(storyData.scenes)[0];
                    }
                    currentSceneId = storyData.startSceneId || null;
                    renderSceneList();
                    if (currentSceneId) {
                        selectScene(currentSceneId);
                    } else {
                        sceneIdInput.value = '';
                        sceneTextInput.value = '';
                        choicesContainer.innerHTML = '';
                    }
                    alert('小说加载成功！');
                } catch (error) {
                    alert('加载小说失败：' + error.message);
                    console.error('加载小说失败:', error);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    previewBtn.addEventListener('click', () => {
        updateCurrentSceneFromEditor(); // 确保最新数据已保存到storyData
        const jsonString = JSON.stringify(storyData, null, 2);
        localStorage.setItem('interactiveStoryData', jsonString); // 将数据存储到localStorage

        // 打开载入器页面
        window.open('../loader/index.html', '_blank');
    });

    // 初始化时渲染场景列表
    renderSceneList();
});
