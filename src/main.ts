import Vue from "vue";
import router from "./router";
import Portfolio from "./Portfolio.vue";
//import VueI18n from 'vue-i18n'

//Vue.use(VueI18n);

import { library } from "@fortawesome/fontawesome-svg-core";
import { 
  faEnvelope,
  faShareAlt
 } from "@fortawesome/free-solid-svg-icons";
import {
  faTwitter,
  faWhatsapp,
  faFacebookMessenger,
  faTelegramPlane,
  faFacebook,
  faReddit,
  faLinkedin,
  faInstagramSquare,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(
  faEnvelope,
  faShareAlt,

  faFacebook,
  faTwitter,
  faWhatsapp,
  faFacebookMessenger,
  faTelegramPlane,
  faReddit,
  faLinkedin,
  faInstagramSquare,
  );
Vue.component("font-awesome-icon", FontAwesomeIcon);

Vue.config.productionTip = false;

new Vue({
  router,
  render: (h) => h(Portfolio),
}).$mount("#portfolio");
