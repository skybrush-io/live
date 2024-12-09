import config from 'config';
import React from 'react';
import { Translation } from 'react-i18next';

import Help from '@material-ui/icons/HelpOutline';
import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';

import store from '~/store';
import {showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';




async function CheckClock(){

  const MsThreShold=2; //MilliSeconds ThreShold
  const ScThreShold=1; //Seconds ThreShold
  const MmThreShold=1; //Minute ThreShold
  const HhThreShold=1; //Hour ThreShold
  const DdThreShold=1; //Days ThreShold


  try{



    const response = await fetch('https://timeapi.io/api/time/current/zone?timeZone=UTC',{ signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    const date_time=new Date(data.dateTime+"Z").getTime();

   

    var currentDate = new Date().getTime(); // Get Actual Date Object
    
    
    //Calculate difference beetween local date and api date 
    const differenceInMilliseconds = Math.round(Math.abs(date_time - currentDate));
    const differenceInSeconds = Math.round(Math.abs(differenceInMilliseconds / 1000));
    const differenceInMinutes = Math.round(Math.abs(differenceInSeconds / 60));
    const differenceInHours = Math.round(Math.abs(differenceInMinutes / 60));
    const differenceInDays = Math.round(Math.abs(differenceInHours / 24));

    var delayed=false;

    if(differenceInMilliseconds>MsThreShold || differenceInSeconds>ScThreShold || differenceInMinutes>MmThreShold || differenceInHours>HhThreShold || differenceInDays>DdThreShold )
    {
      delayed=true
      // Dynamic Message
      var delayParts = [];

      if (differenceInDays > 0) {
            delayParts.push(<div>Days: {differenceInDays}</div>);
      }
      if (differenceInHours > 0) {
            delayParts.push(<div>Hours: {differenceInHours}</div>);
      }
      if (differenceInMinutes > 0) {
            delayParts.push(<div>Minutes: {differenceInMinutes}</div>);
      }
      if (differenceInSeconds > 0) {
            delayParts.push(<div>Seconds: {differenceInSeconds}</div>);
      }
      if (differenceInMilliseconds > 0) {
            delayParts.push(<div>Milliseconds: {differenceInMilliseconds}</div>);
      }
    }


    if(delayed==false){store.dispatch(showNotification({message:"TimeAPI: Gcs clock is Sync",semantics:MessageSemantics.SUCCESS}))}
    else
    {
       store.dispatch(showNotification({message:
        <span>
            TimeAPI : Delay of : <br />
            {delayParts}
        </span>,
        semantics:MessageSemantics.WARNING}))
    }
    return

   }catch{
       store.dispatch(showNotification( { message: 'TimeAPI: No internet Connection , not able to retrieve data',semantics: MessageSemantics.WARNING}));
         return
     }
};

const CheckClockSyncButton  = () => (
    <Translation>
        {(t) => (
      <GenericHeaderButton
        id='tour-CheckClockSync-button'
        tooltip={t('CheckClockSync')}
        onClick={CheckClock}
      >
        <Help />
      </GenericHeaderButton>
    )}
    </Translation>

);

export default CheckClockSyncButton;