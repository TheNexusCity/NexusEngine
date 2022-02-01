declare global {
  interface ImportMeta {
    globEager: (glob: string) => { [module: string]: any }
  }
}

export const store = {
  receptors: [] as Function[],

  // stateModules: {} as { [module: string]: any },
  // registerStateModules(stateModules: { [module: string]: any }) {
  //   Object.assign(store.stateModules, stateModules)
  //   store.receptors.push(
  //     ...Object.entries(stateModules).map(([k, m]) => {
  //       if (!m.receptor) {
  //         console.warn(`${k} is missing a 'receptor' export`)
  //         return () => {}
  //       }
  //       return m.receptor
  //     })
  //   )
  // },

  dispatch(action: { type: string; [key: string]: any }) {
    console.log(action)
    for (const r of store.receptors) r(action)
  }
}

export function useDispatch() {
  return store.dispatch
}

// const userStateModules = import.meta.globEager('./user/services/*State.ts')
// const commonStateModules = import.meta.globEager('./common/services/*State.ts')
// const adminStateModules = import.meta.globEager('./admin/services/*State.ts')
// const adminSettingStateModules = import.meta.globEager('./admin/services/Setting/*State.ts')
// const socialStateModules = import.meta.globEager('./social/services/*State.ts')
// const mediaStateModules = import.meta.globEager('./media/services/*State.ts')

// store.registerStateModules(userStateModules)
// store.registerStateModules(commonStateModules)
// store.registerStateModules(adminStateModules)
// store.registerStateModules(adminSettingStateModules)
// store.registerStateModules(socialStateModules)
// store.registerStateModules(mediaStateModules)
