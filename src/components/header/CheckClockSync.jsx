import config from 'config';
import React from 'react';
import { Translation } from 'react-i18next';

import MoreTime from '@material-ui/icons/MoreTime';
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


 //Get Actual Timezone
 try{

    const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
    const TimeZone_Array = timezone.split("/");
        
    var continent = TimeZone_Array[0];
    var city = TimeZone_Array[1];

  }
  catch{
        store.dispatch(showNotification( { message: 'TimeAPI: Not able to retrieve local timezone.',semantics: MessageSemantics.WARNING}));
        return
  }

  try{


    store.dispatch(showNotification( "TimeAPI: Getting Time from API based on "+continent+"/"+city));

    const response = await fetch('https://timeapi.io/api/time/current/zone?timeZone='+continent+'%2F'+city,{ signal: AbortSignal.timeout(5000) });
    const data = await response.json();
    const api_date_time_complete=JSON.stringify(data.dateTime)
    const regex = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d+)/;
    const match = api_date_time_complete.match(regex); 

    if (match) {
      const year = match[1];
      const month = match[2];
      const day = match[3];
      const hour = match[4];
      const minute = match[5];
      const second = match[6];
      const millisecond = match[7].substring(0, 3); //Take only 3 digit after point
      const final_match= year+"-"+month+"-"+day+"T"+hour+":"+minute+":"+second+"."+millisecond
      var api_data_object=new Date(final_match);

    } else {
      store.dispatch(showNotification( { message: 'TimeAPI: Time format not valid',semantics: MessageSemantics.WARNING}));
      return
    }     



    var currentDate = new Date(); // Get Actual Date Object
      
    
    //Calculate difference beetween local date and api date 
    const differenceInMilliseconds = Math.round(Math.abs(api_data_object - currentDate));
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
        <MoreTime />
      </GenericHeaderButton>
    )}
    </Translation>

);

export default CheckClockSyncButton;