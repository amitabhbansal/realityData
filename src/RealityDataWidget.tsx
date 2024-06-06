import React, { useEffect } from "react";
import {
  StagePanelLocation,
  StagePanelSection,
  UiItemsProvider,
  useActiveIModelConnection,
  useActiveViewport,
  Widget,
  WidgetState,
} from "@itwin/appui-react";
import { ContextRealityModelProps } from "@itwin/core-common";
import { IModelApp } from "@itwin/core-frontend";
import { SvgHelpCircularHollow } from "@itwin/itwinui-icons-react";
import { Alert, IconButton, Slider, ToggleSwitch } from "@itwin/itwinui-react";
import RealityDataApi from "./RealityDataApi";
import "./RealityData.scss";

const RealityDataWidget = () => {
  const iModelConnection = useActiveIModelConnection();
  const viewport = useActiveViewport();

  // START STATE
  const [initialized, setInitialized] = React.useState<boolean>(false);
  const showRealityDataState = React.useRef<Map<string, boolean>>(new Map());
  const transparencyRealityDataState = React.useRef<Map<string, number>>(
    new Map()
  );
  const [availableRealityModels, setAvailableRealityModels] =
    React.useState<ContextRealityModelProps[]>();
  const [updateAttachedState, setUpdateAttachedState] =
    React.useState<string>("");
  const [updateTransparencyState, setUpdateTransparencyState] =
    React.useState<string>("");
  // END STATE

  // START INITIAL_STATE
  // Initialize the widget
  useEffect(() => {
    const asyncInitialize = async () => {
      if (viewport) {
        const availRealityModels = await RealityDataApi.getRealityModels(
          viewport.iModel
        );
        setAvailableRealityModels(availRealityModels);
        for (const model of availRealityModels) {
          showRealityDataState.current.set(model.tilesetUrl, true);
          RealityDataApi.toggleRealityModel(model, viewport, true);
          RealityDataApi.setRealityDataTransparency(model, viewport, 0);
        }
      }
    };
    if (!initialized) {
      void asyncInitialize().then(() => {
        setInitialized(true);
      });
    }
  }, [iModelConnection, viewport, initialized]);
  // END INITIAL_STATE

  // START REALITY_HOOK
  // When the button is toggled, display the realityModel and set its transparency to where the slider is currently set.
  useEffect(() => {
    if (iModelConnection && updateAttachedState) {
      const vp = IModelApp.viewManager.selectedView;
      if (vp && availableRealityModels && showRealityDataState) {
        const model = availableRealityModels.find(
          (x) => x.tilesetUrl === updateAttachedState
        );
        if (model) {
          RealityDataApi.toggleRealityModel(
            model,
            vp,
            showRealityDataState.current.get(model.tilesetUrl)
          );
          RealityDataApi.setRealityDataTransparency(
            model,
            vp,
            transparencyRealityDataState.current.get(model.tilesetUrl)! / 100
          );
        }
      }
    }
    setUpdateAttachedState("");
  }, [
    availableRealityModels,
    iModelConnection,
    showRealityDataState,
    updateAttachedState,
  ]);
  // END REALITY_HOOK

  // START TRANSPARENCY_HOOK
  useEffect(() => {
    if (iModelConnection && updateTransparencyState) {
      const vp = IModelApp.viewManager.selectedView;
      if (vp && availableRealityModels && showRealityDataState) {
        const model = availableRealityModels.find(
          (x) => x.tilesetUrl === updateTransparencyState
        );
        if (model)
          RealityDataApi.setRealityDataTransparency(
            model,
            vp,
            transparencyRealityDataState.current.get(model.tilesetUrl)! / 100
          );
      }
    }
    setUpdateTransparencyState("");
  }, [
    availableRealityModels,
    iModelConnection,
    transparencyRealityDataState,
    updateTransparencyState,
  ]);
  // END TRANSPARENCY_HOOK

  const updateShowRealityDataState = (url: string, checked: boolean) => {
    showRealityDataState.current.set(url, checked);
    setUpdateAttachedState(url);
  };

  const updateRealityDataTransparencyState = (url: string, val: number) => {
    transparencyRealityDataState.current.set(url, val);
    setUpdateTransparencyState(url);
  };

  // START WIDGET_UI
  return (
    <div className="sample-options">
      <div className="sample-options-col">
        {availableRealityModels &&
          availableRealityModels.map((element, index) => {
            return (
              <div key={`reality-model-${index}`}>
                {/* START REALITY_TOGGLE */}
                <ToggleSwitch
                  defaultChecked
                  label={element.name}
                  key={element.tilesetUrl}
                  style={{ marginBottom: "8px" }}
                  onChange={(event) =>
                    updateShowRealityDataState(
                      element.tilesetUrl,
                      event.target.checked
                    )
                  }
                />
                {/* END REALITY_TOGGLE */}
                {/* START TRANSPARENCY_SLIDER */}
                <div>
                  <div className="slider-label">
                    <span>Transparency</span>
                    <IconButton
                      size="small"
                      styleType="borderless"
                      title="Adjusting this slider changes the transparency of the reality data"
                    >
                      <SvgHelpCircularHollow />
                    </IconButton>
                  </div>
                  <Slider
                    min={0}
                    max={99}
                    values={[
                      transparencyRealityDataState.current.get(
                        element.tilesetUrl
                      ) ?? 0,
                    ]}
                    onChange={(values) =>
                      updateRealityDataTransparencyState(
                        element.tilesetUrl,
                        values[0]
                      )
                    }
                  />
                </div>
                {/* END TRANSPARENCY_SLIDER */}
              </div>
            );
          })}
      </div>
      <Alert type="informational" className="instructions">
        Use the toggles for displaying the reality data in the model.
      </Alert>
    </div>
  );
  // END WIDGET_UI
};

// START UI_ITEMS_PROVIDER
export class RealityDataWidgetProvider implements UiItemsProvider {
  public readonly id: string = "RealityDataWidgetProvider";

  public provideWidgets(
    _stageId: string,
    _stageUsage: string,
    location: StagePanelLocation,
    _section?: StagePanelSection
  ): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];
    if (location === StagePanelLocation.Bottom) {
      widgets.push({
        id: "RealityDataWidget",
        label: "Reality Data Controls",
        defaultState: WidgetState.Open,
        content: <RealityDataWidget />,
      });
    }
    return widgets;
  }
}
// END UI_ITEMS_PROVIDER
