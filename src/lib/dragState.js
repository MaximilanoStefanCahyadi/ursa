// shared between CameraRig (writes) and ProjectStar (reads) so a pan drag
// released over a star doesn't count as a click
export const dragState = { dist: 0 }
