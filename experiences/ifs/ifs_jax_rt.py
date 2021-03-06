import sys
import jax
import jax.numpy as jnp
import numpy as np
import time
import os
import rtdisp_jax

#WIDTH = 1024
#HEIGHT = 1024
#PSEUDO_CNTS = 10
#CNT = 20*10000000 # number of particles
#NUM_UPDATES = 5
#SF = 7.0 # constant scale factor avoids flickering

WIDTH = 2048
HEIGHT = 2048
PSEUDO_CNTS = 10
NUM_UPDATES = 4

if 'QUALITY' in os.environ and os.environ['QUALITY']=='low':
    CNT = 1*10000000 # number of particles
    SF = 0.75 # constant scale factor avoids flickering
else:
    CNT = 10*10000000 # number of particles
    SF = 3.0 # constant scale factor avoids flickering

PARAMS = jnp.atleast_2d([
    [ -2.950, 1,     -1,     1],
    [ -2.850, 2.793, -2.697, 1.128 ],
    [ 1.5,    2.5,   0.731,  2.5],
    ])

#
# ---------------------------------------------------------------------------
#

# the core de jong iterator. so simple, so beautiful!
def update( x, y, params ):
    return jnp.sin(params[0]*y) - jnp.cos(params[1]*x), jnp.sin(params[2]*x) - jnp.cos(params[3]*y)

def cnts_to_colors( cnts, SF=9.0 ):
    # adding pseudo counts help eliminate some graininess
    cnts = jnp.log(cnts+PSEUDO_CNTS)

    cnts = cnts - jnp.min(cnts)
    cnts = 255 * (cnts / SF)
    cnts = jnp.minimum( cnts, 255 )

    cnts = cnts.astype(jnp.uint8)
    cnts = 255 - jnp.stack( [cnts, cnts, 0.7*cnts, jnp.zeros_like(cnts) ], axis=2 )
    cnts = cnts.astype( jnp.uint8 )
    return cnts

def bin_particles( x, y ):
    # map points in [-2,2] to image coordinates
    tmpx = ((x+2)/4) * WIDTH
    tmpy = ((y+2)/4) * HEIGHT
    tmpx = tmpx.astype( jnp.uint32 )
    tmpy = tmpy.astype( jnp.uint32 )

    # now count how many points land in each pixel
    linear_indices = ( tmpy*WIDTH+tmpx ).astype(jnp.uint32).flatten()
    newcnts = jnp.bincount( linear_indices, minlength=WIDTH*HEIGHT, length=WIDTH*HEIGHT )
    newcnts = newcnts.reshape((HEIGHT,WIDTH))

    return newcnts

@jax.jit
def do_everything( init_x, init_y, params ):
    cnts = jnp.zeros((HEIGHT,WIDTH))
    x = init_x
    y = init_y

    for n in range(NUM_UPDATES):
        x,y = update( x, y, params )

    cnts += bin_particles( x, y )

    colors = cnts_to_colors( cnts, SF=SF )

    return colors

#
# ---------------------------------------------------------------------------
#

def draw( dt ):
    global tgt_pind, params, step_size, init_x, init_y

    local_step_size = dt * step_size

    diff = PARAMS[tgt_pind,:] - params
    dnorm = np.linalg.norm( diff )
    if dnorm < local_step_size:
        tgt_pind += 1
        if tgt_pind >= PARAMS.shape[0]:
            tgt_pind = 0

    diff = diff / dnorm
    params = params + local_step_size*diff

    colors = do_everything( init_x, init_y, params )

    return colors

# our goal is to move a distance of 0.06 in parameter space per second
step_size = 0.06
tgt_pind = 1
params = PARAMS[0,:]

# we use fixed initial conditions to make everything as smooth as possible
init_x = jnp.array( 4*np.random.rand( CNT, 1 ) - 2 )
init_y = jnp.array( 4*np.random.rand( CNT, 1 ) - 2 )

rtdisp_jax.setup( WIDTH, HEIGHT )
rtdisp_jax.set_draw( draw )
rtdisp_jax.go()
