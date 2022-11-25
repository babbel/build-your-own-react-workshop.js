const STATUS = {
    success: 'success',
    progress: 'progress',
    failing: 'failing'
};

const getRoot = () => document.querySelector('#root');

const checkStatusChapter1Step1 = () => {
    const root = getRoot();
    if (!root.hasChildNodes() || root.children[0].className === 'fallback') {
        return {
            status: STATUS.failing,
        }
    }
    const childTagName = root.children[0].tagName;
    if (childTagName === 'DIV') {
        return {
            status: STATUS.progress,
            message: "Awesome! You can render a div! Try to replace the code in the index to see if your code can also handle a span or other tags!",
        }
    }
    return {
        status: STATUS.success,
    };
};

const checkStatusChapter1Step2 = () => {
    const root = getRoot();
    const rootChild = root.children[0];
    if (rootChild.id === '') {
        return {
            status: STATUS.failing,
            message: 'Looks like the id is not filled correctly'
        };
    }
    if (rootChild.ariaHidden && rootChild.className) {
        return {
            status: STATUS.success,
        };
    }
    if (!rootChild.ariaHidden && !rootChild.className) {
        return {
            status: STATUS.progress,
            message: 'Great, you got the ID working, can you make other attributes like aria-hidden work?'
        };
    }
    if (!rootChild.ariaHidden) {
        return {
            status: STATUS.progress,
            message: 'Great, you got the ID and className working, can you make other attributes like aria-hidden work?'
        };
    }
    if (!rootChild.className) {
        return {
            status: STATUS.progress,
            message: 'Great, you got the ID and aria-hidden working, can you make other attributes like className work?'
        };
    }
}

const checkStatusChapter1Step3 = () => {
    const root = getRoot();
    const rootChild = root.children[0];
    if (rootChild.hasChildNodes()) {
        return {
            status: STATUS.success,
        }
    }
    return {
        status: STATUS.failing,
    };
};

const checkElementIsSimpleTest = (element, message) => {
    return (
        element
        && element.tagName === 'SPAN'
        && element.innerText !== ""
        && message ? element.innerText === message : true
    );
};

const isSimpleTestRendered = (root) => {
    const rootChild = root.children[0];
    if (!rootChild || rootChild.className !== 'test') {
        return false;
    }
    return checkElementIsSimpleTest(rootChild.querySelector('span'));
}

const isSimpleTestWithPropsRendered = (root) => {
    return isSimpleTestRendered(root) && root.querySelector('span').innerText !== "Hello World!";
};

const isMegaTestRendered = (root) => {
    const rootChild = root.children[0];
    if (!rootChild) {
        return false;
    }
    const firstChild = rootChild.children[0];
    const secondChild = rootChild.children[1];
    if (!firstChild || !secondChild) {
        return false;
    }
    return checkElementIsSimpleTest(firstChild, "Hello world!") && checkElementIsSimpleTest(secondChild, "Super fun!");
};

const checkStatusChapter1Step4 = () => {
    const root = getRoot();
    if (!root.hasChildNodes()) {
        return {
            status: STATUS.failing,
            message: 'Looks like SimpleTest does not render yet'
        };
    }
    if (isMegaTestRendered(root)) {
        return {
            status: STATUS.success,
        };
    }
    if (isSimpleTestWithPropsRendered(root)) {
        return {
            status: STATUS.progress,
            message: 'Great looks like SimpleTestWithProps renders, let\'s try MegaTest!'
        };
    }
    if (isSimpleTestRendered(root)) {
        return {
            status: STATUS.progress,
            message: 'Great looks like SimpleTest renders, let\'s try SimpleTestWithProps!'
        };
    }
    return {
        status: STATUS.failing,
        message: 'Looks like SimpleTest does not render yet'
    };
}

const checks = {
    'chapter-1/step-1': checkStatusChapter1Step1,
    'chapter-1/step-2': checkStatusChapter1Step2,
    'chapter-1/step-3': checkStatusChapter1Step3,
    'chapter-1/step-4': checkStatusChapter1Step4,
};


const createStatusIndicatorLight = () => {
    const element = document.createElement('div');
    const statusToColor = {
        [STATUS.success]: '#00ff00',
        [STATUS.progress]: '#ff8800',
        [STATUS.failing]: '#ff0000'
    }
    element.style = 'border-radius: 50%; height: 14px; width: 14px;';
    const setStatusLight = (status) => {
        element.style.backgroundColor = statusToColor[status]
    };
    return { element, setStatusLight };
}

const createStatusIndicator = () => {
    const statusIndicatorElement = document.createElement('div');
    statusIndicatorElement.style = `
    border-radius: 8px;
    position: absolute;
    top: 20px;
    right: 20px;
    border: solid 1px black;
    padding: 10px;
    max-width: 200px;
`;
    const { element: lightElement, setStatusLight } = createStatusIndicatorLight();
    const messageElement = document.createElement('span');
    statusIndicatorElement.appendChild(lightElement);
    statusIndicatorElement.appendChild(messageElement);
    const setStatus = ({ status, message = '' }) => {
        setStatusLight(status);
        messageElement.innerText = message;
    };
    document.body.appendChild(statusIndicatorElement);
    return { setStatus };
}

const setup = (currentBranch) => {
    const check = checks[currentBranch];
    if (check) {
        const { setStatus } = createStatusIndicator();
        setStatus(check());
    }
};

window.setupStatusChecker = setup;