<script>
import { browser } from '$app/environment'
  import { App } from '@capacitor/app'
  if(browser){
    App.addListener( 'backButton', ( { canGoBack } ) => {
      if ( !canGoBack ) {
          App.exitApp()
      } else {
          window.history.back()
      }
  } )
  }
  
  //
  
    import "../app.css";
</script>
<slot></slot>