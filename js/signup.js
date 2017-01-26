
Vue.use(VueMaterial)
Vue.use(VueMaterial.MdCore) //Required to boot vue material
Vue.use(VueMaterial.MdButton)
Vue.use(VueMaterial.MdIcon)
Vue.use(VueMaterial.MdSidenav)
Vue.use(VueMaterial.MdToolbar)

Vue.material.registerTheme('default', {
  primary: 'white',
  accent: 'blue',
  warn: 'red',
  background: 'white'
});


var app = new Vue({
  el: "#app",
  data: {
    id: "",
    command: "",
  },
  methods: {
    enterUsername: function(e) {
      e.preventDefault();
      app.id = app.command;
      app.command = "";
      app.prompt = "password: ";
    },
    enterPassword: function(e) {
      e.preventDefault();
      var sk = app.command;
      app.command = "";
      alert(app.id + " " + sk);
    },
    focus: function() {
      document.getElementById('prompt').focus();
    },
  }
});
