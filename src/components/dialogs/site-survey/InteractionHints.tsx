// @ts-nocheck

import {
  Box,
  Collapse,
  Fade,
  IconButton,
  Slide,
  Tab,
  Tabs,
  Typography,
  withStyles,
} from '@material-ui/core';
import React, { useState } from 'react';

import { Edit, Mouse, PanTool, SelectAll } from '@material-ui/icons';
import { TabContext, TabPanel } from '@material-ui/lab';

const MiniTabs = withStyles({
  root: {
    minHeight: 0,
  },
  indicator: {
    display: 'none',
  },
})(Tabs);

const MiniTab = withStyles({
  root: {
    minHeight: 0,
    padding: '0 8px',
  },
  wrapper: {
    flexDirection: 'row',
    gap: 4,

    // '& .MuiSvgIcon-root': {
    //   width: '0.75em',
    //   height: '0.75em',
    //
    //   margin: 0,
    // },
  },
})((props) => <Tab disableRipple {...props} />);

const InteractionHint = ({
  keys,
  action,
}: Readonly<{ keys: string[]; action: string }>): JSX.Element => (
  <span>
    {keys.map((k) => (
      <kbd key={k}>{k}</kbd>
    ))}
    <span>{action}</span>
  </span>
);

const InteractionHints = () => {
  const categories = [
    {
      title: 'Navigation',
      icon: Mouse, // Maybe `PanTool`?
      hints: [
        { keys: ['Drag'], action: 'Pan' },
        { keys: ['Scroll'], action: 'Zoom' },
        { keys: ['Shift', 'Alt', 'Drag'], action: 'Rotate' },
      ],
    },
    {
      title: 'Selection',
      icon: SelectAll,
      hints: [
        { keys: ['Click'], action: 'Select' },
        { keys: ['Ctrl', 'Click'], action: 'Toggle selection' },
        { keys: ['Shift', 'Drag'], action: 'Box select' },
        { keys: ['Alt', 'Drag'], action: 'Box unselect' },
      ],
    },
    {
      title: 'Manipulation',
      icon: Edit,
      hints: [
        { keys: ['Drag'], action: 'Move selection' },
        { keys: ['Alt', 'Drag'], action: 'Rotate selection' },
      ],
    },
  ];

  const [active, setActive] = useState(0);

  return (
    <Box display='flex'>
      <Box>
        <TabContext>
          <MiniTabs value={active}>
            {categories.map(({ icon: Icon, title }, i) => (
              <MiniTab
                icon={<Icon fontSize='small' style={{ margin: 0 }} />}
                key={title}
                label={title}
                onMouseOver={() => setActive(i)}
              />
            ))}
          </MiniTabs>

          {categories.map((c, i) => (
            // <TabPanel key={c.title} value={c.title}>
            <Fade key={c.title} in={active === i}>
              <Box position='absolute' display='flex' sx={{ gap: 16 }}>
                {c.hints.map((h) => (
                  <InteractionHint key={h.keys.join('+')} {...h} />
                ))}
              </Box>
            </Fade>
            // </TabPanel>
          ))}
        </TabContext>

        {/* <Box display='flex' sx={{ gap: 8 }}> */}
        {/*   {categories.map((c, i) => ( */}
        {/*     <Typography */}
        {/*       key={c.title} */}
        {/*       variant='subtitle2' */}
        {/*       onMouseOver={() => { */}
        {/*         setActive(i); */}
        {/*       }} */}
        {/*       sx={{ textDecoration: 'underline' }} */}
        {/*     > */}
        {/*       {c.title} */}
        {/*     </Typography> */}
        {/*   ))} */}
        {/* </Box> */}

        {/* <Box> */}
        {/*   {categories.map((c, i) => ( */}
        {/*     <Collapse key={c.title} in={active === i}> */}
        {/*       {c.hints.map((h) => ( */}
        {/*         <InteractionHint key={h.keys.join('+')} {...h} /> */}
        {/*       ))} */}
        {/*     </Collapse> */}
        {/*   ))} */}
        {/* </Box> */}
      </Box>
    </Box>
  );
};

// const interactionHints = (
//   <Box display='flex'>
//     <IconButton disabled>
//       <Mouse />
//     </IconButton>
//     <Box display='flex'>
//       <Box display='flex' alignItems='center' style={{ gap: 8 }}>
//         <Typography variant='subtitle2'>Navigation</Typography>
//         <Box>
//           <InteractionHint keys={['Drag']} action='Pan' />
//           <InteractionHint keys={['Scroll']} action='Zoom' />
//           <InteractionHint keys={['Shift', 'Alt', 'Drag']} action='Rotate' />
//         </Box>
//       </Box>
//       <Divider style={{ margin: '4px 0px' }} />
//       <Box display='flex' alignItems='center' style={{ gap: 8 }}>
//         <Typography variant='subtitle2'>Selection</Typography>
//         <Box>
//           <InteractionHint keys={['Click']} action='Select' />
//           <InteractionHint keys={['Ctrl', 'Click']} action='Toggle selection' />
//           <InteractionHint keys={['Shift', 'Drag']} action='Box select' />
//           <InteractionHint keys={['Alt', 'Drag']} action='Box unselect' />
//         </Box>
//       </Box>
//       <Divider style={{ margin: '4px 0px' }} />
//       <Box display='flex' alignItems='center' style={{ gap: 8 }}>
//         <Typography variant='subtitle2'>Manipulation</Typography>
//         <Box>
//           <InteractionHint keys={['Drag']} action='Move selection' />
//           <InteractionHint keys={['Alt', 'Drag']} action='Rotate selection' />
//         </Box>
//       </Box>
//     </Box>
//   </Box>
// );

export default InteractionHints;
