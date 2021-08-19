import UAParser from 'ua-parser-js';

interface UserInfo {
    mobile: boolean;
    appleWebKit: boolean;
}

function userInfo(): UserInfo {
    const UA = window && window.navigator && window.navigator.userAgent || '';
    const UAP = new UAParser(UA);

    return {
        mobile: UAP.getDevice().type === 'mobile', // donut is sadly terrible on mobile
        appleWebKit: UA.indexOf('AppleWebKit') > -1, // SVG animation is/was slow in Safari based browsers
    }
}

export default userInfo;
