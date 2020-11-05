<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>
        {{ meta.name }} <v-chip v-if="meta.version" color="white" label small outlined>v{{ meta.version }}</v-chip>
      </v-toolbar-title>
      <v-progress-linear :active="loading" height="10" :value="loadingValue" absolute bottom color="orange" />
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>mdi-information-outline</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>mdi-cog-outline</v-icon>
      </v-btn>
    </v-app-bar>
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
      if (arg === 100) thisclass.loading = false;
      console.log(arg);
    });
  },
};
</script>
