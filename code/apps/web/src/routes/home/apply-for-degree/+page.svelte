<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import * as Command from "$lib/components/ui/command";
  import { getFirebaseFirestoreClient, getFirebaseFunctionsClient } from "$lib/firebase/firebase.app";
  import { Collections, type UniversityDegree, type UserRegisteredDegree } from "@cos720project/shared";
  import { collection, getDocs } from "firebase/firestore";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import * as AlertDialog from "$lib/components/ui/alert-dialog";
  import { toast } from "svelte-sonner";
  import { httpsCallable, type HttpsCallableResult } from "firebase/functions";
  import { functionNames } from "$lib/app-constants";
  import { stripObject } from "$lib/functions";
	import { userAuthInfo, userDegrees } from "../../../stores";
	import { FirebaseError } from "firebase/app";

  let searchWord = writable("");
  let block = false;
  // grouped by faculty
  type Dictionary = {[key:string]: UniversityDegree[]};
  let degrees:UniversityDegree[][] = [];

  const queryFirebase = async () => {
    const db = getFirebaseFirestoreClient()
    const degreesCollection = collection(db,Collections.degrees);
    // get all degrees
    const searchDegreesSnapshot = await getDocs(degreesCollection);
    let groupedDocuments:Dictionary = {};
    searchDegreesSnapshot.forEach((degree) => {
      if (!degree.exists()) return
      const typedDegree = degree.data() as UniversityDegree;
      if (typedDegree.discontinued) return;
      if (!groupedDocuments[typedDegree.department]) groupedDocuments[typedDegree.department] = []
      groupedDocuments[typedDegree.department].push(typedDegree);
    });
    degrees = Object.entries(groupedDocuments).map(([_,value]) => value);
  };
  const registerForDegree = async (degree:UniversityDegree) => {
    const functions = getFirebaseFunctionsClient();
    const timeNow = new Date();
    const userRegistration:UserRegisteredDegree =  {
      completedCredits : 0,
      degreeId: degree.id!,
      enrolledModules : [],
      enrollmentDate : timeNow,
      expectedGraduationDate : timeNow,
      status : "active",
      userId : $userAuthInfo!.uid,
    };
    const userRegistrationCopy = {...userRegistration};
    userRegistrationCopy.degree = degree;
    const registerDegree = httpsCallable(functions, functionNames.userDegreeFunctions.registerDegree);
    try {
      if (block) {
        toast("Slow down there cowboy");
        return;
      }
      block = true;
      await registerDegree(stripObject(userRegistration));
      toast("Degree Registration Success! You can fill out your module registration in the module manager")
      userDegrees.update((og) => {
        og.push(userRegistrationCopy)
        return og;
      })
      block = false;
      goto("/home");
    } catch (error) {
      if (error instanceof FirebaseError) {
        block = false;
        toast(error.message);
        await setTimeout(()=>{},200)
        toast("If you have signed in for the first time, please log out and log back in again.");
      }
    }
  };
  onMount(() => {queryFirebase()});
</script>
 
<Command.Root>
  <Command.Input placeholder="Type a command or search..." bind:value={$searchWord} />
  <Command.List class="max-h-[500px]">
    <Command.Empty>No results found.</Command.Empty>
    {#each degrees as group}
      <Command.Group heading={group.at(0)?.department}>
        {#each group as degree}
          <Command.Item
            value={degree.code + degree.name}
          >
            <AlertDialog.Root >
            <AlertDialog.Trigger class="flex grow">{"(" + degree.code + ") " + degree.name}</AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Header>
                <AlertDialog.Title>Are you sure you want to register?</AlertDialog.Title>
                <AlertDialog.Description>
                  For this demo, the registration will be immediately accepted, normally the user would need to upload their results and then those results be reviewed.
                </AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action on:click={() => registerForDegree(degree)}>Continue</AlertDialog.Action>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog.Root>
          </Command.Item>
        {/each}
      </Command.Group>
    {/each}
  </Command.List>
</Command.Root>

