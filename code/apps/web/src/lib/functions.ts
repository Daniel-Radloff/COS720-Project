import { Collections, userRegisteredDegree as registeredDegreeValidator, universityDegree as universityDegreeValdiator, universityModule as universityModuleValidator } from "@cos720project/shared";
import { get, type Readable, type Writable } from "svelte/store";
import {browser} from "$app/environment";
import { getFirebaseFirestoreClient } from "./firebase/firebase.app";
import { userDegrees } from "../stores";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

export const awaitStore = async (store:Writable<unknown|undefined>|Readable<unknown|undefined>):Promise<boolean> => {
  if (!browser) return false;
  let isLoaded = false;
  let timeout = 0;
  // +- 10 seconds which is firestore retry aswell.
  const maxRetry = 50;
  while (!isLoaded && timeout < maxRetry) {
    const storeValue = get(store);
    if (Array.isArray(storeValue)) {
      if ((storeValue as Array<unknown>).length != 0) isLoaded = true;
    } else if (storeValue != undefined) {
      isLoaded = true;
    }
    await new Promise((resolve) => setTimeout(resolve,200));
    timeout = timeout + 1;
  }
  if (timeout == maxRetry) {
    console.error("lib/functions awaitStore(store): Max Retry Exceeded on listener");
    throw Error("lib/functions awaitStore(store): Max Retry Exceeded on listener");
  }
  return true;
};

export const loadDegreeStore = async (uid:string) => {
  if (!browser) return;
  // get all the degrees that the user has
  const firestore = getFirebaseFirestoreClient();
  const userRegisteredDegreesReference = query(
    collection(firestore,Collections.userDegree),
    where("userId", "==", uid)
  );
  const userRegisteredDegreesSnap = await getDocs(userRegisteredDegreesReference);

  // eslint-disable-next-line
  let validatedUserDegrees = userRegisteredDegreesSnap.docs.map((degree) =>
    registeredDegreeValidator.parse(degree.data())
  );

  userDegrees.set(validatedUserDegrees);

  // populate degree details for each degree
  const degreePromises = validatedUserDegrees.map(async (degree, index) => {
    const degreeRef = doc(firestore,Collections.degrees,degree.degreeId)
    const degreeSnap = await getDoc(degreeRef);
    if (degreeSnap.exists()) {
      const validatedDegreeInformationData = universityDegreeValdiator.parse(degreeSnap.data())
      userDegrees.update((currentValue) => {
        currentValue![index].degree = validatedDegreeInformationData;
        return currentValue;
      })
    } else {
      throw new Error("Document Reference does not exist, degreeID is incorrect functions/loadDegreeStore");
    }
  })
  const modulePromises = validatedUserDegrees.flatMap((degree,degreeIndex) => {
    // populate the modules for each degree
    return degree.enrolledModules.map(async (module,moduleIndex) => {
      const moduleRef = doc(firestore,Collections.modules,module.moduleId);
      const moduleSnap = await getDoc(moduleRef);
      if (moduleSnap.exists()) {
        const validatedModuleData = universityModuleValidator.parse(moduleSnap.data());
        // Updating dom as soon as we get info
        userDegrees.update((currentValue) => {
          currentValue![degreeIndex].enrolledModules[moduleIndex].module = validatedModuleData;
          return currentValue
        })
      }
      else {
        throw new Error("Document Reference does not exist, moduleID is incorrect functions/loadDegreeStore")
      }
    })
  })

  // TODO add a warning store
  await Promise.allSettled(degreePromises);
  // TODO add a warning store
  await Promise.allSettled(modulePromises);

};