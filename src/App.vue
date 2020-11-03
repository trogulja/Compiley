<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>
        {{ meta.name }} <v-chip v-if="meta.version" color="white" label small outlined>v{{ meta.version }}</v-chip>
      </v-toolbar-title>
      <v-progress-linear
        :active="loading"
        height="10"
        :value="loadingValue"
        absolute
        bottom
        color="orange"
      ></v-progress-linear>
      <v-spacer></v-spacer>
      <v-app-bar-nav-icon @click="drawer = true"></v-app-bar-nav-icon>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" absolute temporary>
      <v-list nav dense>
        <v-list-item-group v-model="group" active-class="deep-purple--text text--accent-4">
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-account</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Account</v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <ParserControl />
    </v-main>
  </v-app>
</template>

<script>
import ParserControl from './components/ParserControl';

export default {
  name: 'App',

  components: {
    ParserControl,
  },

  data: () => ({
    drawer: false,
    group: false,
    loading: false,
    loadingValue: 0,
    meta: {
      name: 'Compiley',
      version: false,
    },
  }),

  created() {
    const thisclass = this;
    window.ipcRenderer.on('title', function (event, arg) {
      thisclass.meta.name = arg.name;
      thisclass.meta.version = arg.version;
    });
    window.ipcRenderer.on('job', function (event, arg) {
      if (arg === 'started') thisclass.loading = true;
      if (arg === 'stopped') thisclass.loading = false;
      if (typeof arg === 'number') thisclass.loadingValue = arg;
    });
  },
};
</script>
