<script>
  import { browser } from '$app/environment'
  import { App } from '@capacitor/app'
  import { loger } from '$lib/stores/logs/logs.svelte';
  
  function getPlatform() {
      if (window.Capacitor) {
          if (window.Capacitor.getPlatform) {
            return window.Capacitor.getPlatform(); // 'ios', 'android', 'web'
          }
      }
      return 'android'; // fallback
  }
  const isIOS  = getPlatform()!="android"
  if(browser){
    App.addListener( 'backButton', ( { canGoBack } ) => {
      if ( !canGoBack ) {
          App.exitApp()
      } else {
          window.history.back()
      }
    } )
    if(isIOS){
      document.documentElement.classList.add('ios');
    }
    let d = document.documentElement
    loger.addTextLog("d: "+JSON.stringify(d,null,2))
    loger.addTextLog("document: "+JSON.stringify(document,null,2))
  }
  import "../app.css";
</script>
<slot></slot>