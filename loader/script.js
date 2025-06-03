document.addEventListener('DOMContentLoaded', () => {
    const sceneTextElement = document.getElementById('scene-text');
    const choicesContainer = document.getElementById('choices-container');
    const endingDisplay = document.getElementById('ending-display');
    const endingTextElement = document.getElementById('ending-text');
    const restartBtn = document.getElementById('restart-btn');

    let storyData = null;
    let currentSceneId = null;
    let gameState = {};

    // --- 辅助函数 ---
    function loadStory() {
        const jsonString = localStorage.getItem('interactiveStoryData');
        if (jsonString) {
            try {
                storyData = JSON.parse(jsonString);
                if (!storyData.scenes || typeof storyData.scenes !== 'object') {
                    throw new Error("Invalid story format: 'scenes' missing or not an object.");
                }
                // 游戏状态不再包含变量/道具/角色
                gameState = {};

                currentSceneId = storyData.startSceneId;
                displayScene(currentSceneId);
            } catch (error) {
                alert('加载小说失败：' + error.message + '。请确保从编辑器正确保存了小说。');
                console.error('加载小说失败:', error);
                // 如果加载失败，提供一个文件选择器让用户手动加载
                promptForFileLoad();
            }
        } else {
            alert('未找到已保存的小说数据。请从编辑器保存小说后重试，或手动加载文件。');
            promptForFileLoad();
        }
    }

    function promptForFileLoad() {
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
                    // 游戏状态不再包含变量/道具/角色
                    gameState = {};

                    currentSceneId = storyData.startSceneId;
                    displayScene(currentSceneId);
                    alert('小说加载成功！');
                } catch (error) {
                    alert('加载小说失败：' + error.message);
                    console.error('加载小说失败:', error);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }


    function displayScene(sceneId) {
        endingDisplay.style.display = 'none'; // 隐藏结局显示
        choicesContainer.innerHTML = ''; // 清空选项

        const scene = storyData.scenes[sceneId];
        if (!scene) {
            sceneTextElement.textContent = '错误：场景 ' + sceneId + ' 不存在。';
            return;
        }

        sceneTextElement.textContent = scene.text;

        // 检查是否达到结局
        const reachedEnding = checkEndings();
        if (reachedEnding) {
            endingTextElement.textContent = reachedEnding.text;
            endingDisplay.style.display = 'block';
            return;
        }

        // 显示选项
        scene.choices.forEach(choice => {
            // 检查选项条件
            if (checkConditions(choice.conditions)) {
                const button = document.createElement('button');
                button.textContent = choice.text;
                button.addEventListener('click', () => chooseOption(choice));
                choicesContainer.appendChild(button);
            }
        });
    }

    function chooseOption(choice) {
        // 应用效果
        applyEffects(choice.effects);
        displayScene(choice.targetSceneId);
    }

    function checkConditions(conditions) {
        // 由于移除了变量/道具/角色管理，目前所有条件都视为满足
        return true;
    }

    function applyEffects(effects) {
        // 由于移除了变量/道具/角色管理，目前没有效果需要应用
        return;
    }

    function checkEndings() {
        if (!storyData.endings || storyData.endings.length === 0) return null;

        for (const ending of storyData.endings) {
            if (checkConditions(ending.conditions)) {
                return ending;
            }
        }
        return null;
    }

    restartBtn.addEventListener('click', () => {
        if (storyData) {
            // 重置游戏状态
            gameState = {};
            currentSceneId = storyData.startSceneId;
            displayScene(currentSceneId);
        } else {
            // 如果没有加载故事，则重新加载
            loadStory();
        }
    });

    // 初始化加载故事
    loadStory();
});
