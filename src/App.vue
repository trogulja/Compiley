<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>
        <v-btn icon disabled>
          <v-img :src="require('./assets/octopus.svg')" contain aspect-ratio="1" height="45" />
        </v-btn>
        {{ meta.name }} <v-chip v-if="meta.version" color="white" label small outlined>v{{ meta.version }}</v-chip>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-dialog v-model="informacije" fullscreen hide-overlay transition="dialog-bottom-transition">
        <template v-slot:activator="{ on, attrs }">
          <v-btn :disabled="loading" icon v-bind="attrs" v-on="on">
            <v-icon>mdi-information-outline</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-toolbar dark color="primary">
            <v-btn icon dark @click="informacije = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title>API information</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
          <template v-for="(x, i) in api">
            <v-list three-line subheader :key="`x-${i}`">
              <v-subheader>{{ x.meta }}</v-subheader>
              <v-list-item v-for="(y, j) in x.info" :key="`y-${j}`">
                <v-list-item-content>
                  <v-list-item-title>{{ apiLoc + y.url }}</v-list-item-title>
                  <v-list-item-subtitle>{{ y.desc }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
            <v-divider v-if="i < api.length - 1" :key="`xd-${i}`"></v-divider>
          </template>
        </v-card>
      </v-dialog>
      <v-btn :disabled="loading" icon>
        <v-icon>mdi-cog-outline</v-icon>
      </v-btn>
      <v-progress-linear :active="loading" height="10" :value="loadingValue" absolute bottom color="orange" />
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
    informacije: false,
    apiLoc: 'http://localhost:8178',
    api: [
      {
        meta: 'API za korištenje u formulama',
        info: [
          { url: '/compact', desc: 'Compact podaci' },
          { url: '/worktime', desc: 'Worktime podaci' },
          { url: '/klzclaro', desc: 'Broj slika po mjesecima koje su prošle kroz claro' },
          { url: '/dailywork', desc: 'Suma vremena rada za 24h, VL, PD i Austriju po danima - Presence amount i duration je bez Dejana Kumpara' },
          { url: '/metajobs', desc: 'Popis svih prisutnih poslova u bazi i njihove postavke' },
        ],
      },
      {
        meta: 'API za korištenje u formulama',
        info: [
          { url: '/problems/amount', desc: 'Lista svih poslova koji imaju 0 upisanu pod količinom' },
          { url: '/problems/duration', desc: 'Lista svih poslova koji imaju 0 upisano pod trajanjem' },
          {
            url: '/problems/worktime',
            desc: 'Provjera po osobama i danima gdje ima prisutnost, a nema rada i obratno',
          },
        ],
      },
    ],
    notifications: false,
    sound: true,
    widgets: false,
  }),

  created() {
    const thisclass = this;
    window.ipcRenderer.on('title', function(event, arg) {
      thisclass.meta.name = arg.name;
      thisclass.meta.version = arg.version;
    });
    window.ipcRenderer.on('job', function(event, arg) {
      if (arg === 'started') thisclass.loading = true;
      if (arg === 'stopped') thisclass.loading = false;
      if (typeof arg === 'number') thisclass.loadingValue = arg;
      if (arg === 100) thisclass.loading = false;
      console.log(arg);
    });
  },
};
</script>
