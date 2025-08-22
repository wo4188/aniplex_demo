import { createApp, ref } from 'vue';
import { personArr } from './data.js';

import 'simplebar';

const app = createApp({
  setup() {
    const foldList = ref(personArr());
    const audioEnabled = ref(false);

    console.log('🚀 ~ setup ~ foldList 👉', foldList.value);

    const switchAudioEnabled = () => {
      audioEnabled.value = !audioEnabled.value;
    };

    return {
      foldList,
      audioEnabled,
      switchAudioEnabled,
    };
  },
});

app.mount('#app');
