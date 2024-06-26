/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "./App.scss";
import React, { useEffect } from "react";
import { UiFramework } from "@itwin/appui-react";
import {
  BlankConnectionViewState,
  Viewer,
  ViewerNavigationToolsProvider,
} from "@itwin/web-viewer-react";
import { RealityDataWidgetProvider } from "./RealityDataWidget";
import { authClient } from "./common/AuthorizationClient";
import { Cartographic, ColorDef, RenderMode } from "@itwin/core-common";
import { Matrix3d, Range3d } from "@itwin/core-geometry";
import { IModelApp, ScreenViewport, Viewport } from "@itwin/core-frontend";

// START VIEW_SETUP
const uiProviders = [
  new RealityDataWidgetProvider(),
  new ViewerNavigationToolsProvider(),
];

//When there is no imodel
const blankConnectionViewState: BlankConnectionViewState = {
  displayStyle: { backgroundColor: ColorDef.black },
  viewFlags: { renderMode: RenderMode.SmoothShade },
  setAllow3dManipulations: true,
};

const onIModelAppInit = () => {
  // Listen for the screen viewport to open
  IModelApp.viewManager.onViewOpen.addOnce(onViewSynchronized);
};

const onViewSynchronized = (vp: ScreenViewport) => {
  // Listen for the viewport and viewstate to synchronize
  vp.onViewChanged.addOnce(setupView);
};

/**
 * Manipulate the initial view state to look pretty. You can comment this out to see the default view.
 * The BlankConnectionViewState interface also exposes a limited set of parameters (in `lookAt`) that can change the initial view.
 */
const setupView = (vp: Viewport) => {
  if (vp && vp.view.is3d()) {
    // Set the origin required for the view
    vp.view.setOrigin({
      x: -184,
      y: -73,
      z: -74,
    });
    // Set the extents of the view frustum (this is different than the extents for the project)
    vp.view.setExtents({
      x: 395.0617283950802,
      y: 381.4973772055495,
      z: 39.50617283951034,
    });
    /**
     * Rotate the view so it looks good. This value (and the ones above) were generated by manually manipulating the view to look good
     * and then logging the origin, extents, and rotation of that view.
     */
    const rotationMatrix = Matrix3d.fromJSON([
      [0.9800665778412416, 0.1986693307950613, 1.2365108936762105e-17],
      [-0.09011563789485497, 0.44455439844762656, 0.891207360061435],
      [0.17705556982303852, -0.8734425475223379, 0.4535961214255781],
    ]);
    vp.view.setRotation(rotationMatrix);
    vp.synchWithView();
  }
};
// END VIEW_SETUP

const iTwinId = process.env.IMJS_ITWIN_ID;

const RealityDataApp = () => {
  /** Sign-in */
  useEffect(() => {
    void authClient.signIn();
  }, []);

  /** The sample's render method */
  // START VIEWER
  return (
    <div className="viewer-container">
      <Viewer
        iTwinId={iTwinId ?? ""}
        authClient={authClient}
        // This is the geographic location of the reality data in the real world.
        location={Cartographic.fromDegrees({
          longitude: -75.686694,
          latitude: 40.065757,
          height: 0,
        })}
        /**
         * An extent is the volume/area occupied by the models/project.
         * These are the extents extracted from the reality data's root document, converted from world extents to local extents.
         */
        extents={new Range3d(-194, -215, -56, 194, 216, 387)}
        // The IModelApp singleton still loads even without an iModel provided (just without iModel specific properties defined).
        onIModelAppInit={onIModelAppInit}
        blankConnectionViewState={blankConnectionViewState}
        defaultUiConfig={{
          hideStatusBar: true,
          hideToolSettings: true,
        }}
        enablePerformanceMonitors={false}
        uiProviders={uiProviders}
        theme={process.env.THEME ?? "dark"}
      />
    </div>
  );
  // END VIEWER
};

// Define panel size
UiFramework.frontstages.onFrontstageReadyEvent.addListener((event) => {
  const { bottomPanel } = event.frontstageDef;
  bottomPanel && (bottomPanel.size = 200);
});

export default RealityDataApp;
