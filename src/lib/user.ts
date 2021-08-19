interface UserInfo {
  mobile: boolean;
  appleWebKit: boolean;
}

function userInfo(): UserInfo {
  const UA = (window && window.navigator && window.navigator.userAgent) || "";

  return {
    mobile: UA.match(/(iPhone|iPod|iPad|Android|BlackBerry)/).length > 0, // donut is sadly terrible on mobile
    appleWebKit: UA.indexOf("AppleWebKit") > -1, // SVG animation is/was slow in Safari based browsers
  };
}

export default userInfo;
