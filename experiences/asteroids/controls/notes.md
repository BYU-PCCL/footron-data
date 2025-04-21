In order to avoid updating the Footron-web dependencies I used vite to pack the only non-standard dependencies in this component. 
Namely:
 - Pagination from `@mui/material`
     pagination only exists in the new version, not in `@material-ui/core`.
     This is also responsible for nearly all of the bulk
 - ReactJoystickComponent from react-joystick-component

These are instead supplied by the `NonStandardDependencies.es.js` file.

This does lock these two dependencies from being updated which isn't ideal, but given that `@material-ui/core` is also depricated I figure it's not a huge deal.

Should you need to update these dependencies in this way rename the `custom-vite-packing` file to `vite.config.ts` then run `yarn vite build` and copy the output from `/dist` into `/lib`.
Although, it may be worthwhile to instead change `footron-web` so that it allows sub-components with other dependencies.
> Christian