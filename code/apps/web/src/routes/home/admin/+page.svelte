<script lang="ts">
  import { AdminServices } from '$lib/app-constants';
  import { HomeCardButton } from '$lib/components/ui/home-card-button';
  import { userMetadata } from '../../../stores';
	import { awaitStore } from '$lib/functions';
	import { onMount } from 'svelte';
  //export let data: PageData;
  
  let isLoading = true;

  onMount(async ()=> {
    if ($userMetadata == undefined) {
      // lambda to await store before loading data
      (async () => {
        try {
          isLoading = !(await awaitStore(userMetadata));
        } catch (error) {
          console.error(error);
        }
      })()
    } else {
      isLoading = false;
    }
  })
</script>
<div class="flex flex-wrap justify-center">
  {#each AdminServices as service}
  <HomeCardButton href={service.href} image_url={service.image_url} service_name={service.service_name} loading={isLoading}/>
  {/each}
</div>