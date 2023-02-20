import { DefaultPluginSpec, PluginSpec } from "molstar/lib/mol-plugin/spec";
import { PluginContext } from "molstar/lib/mol-plugin/context";
import { PluginConfig } from "molstar/lib/mol-plugin/config";
import { createRef, useEffect, useState } from "react";
import { StateObjectSelector } from "molstar/lib/mol-state";
import { PluginStateObject } from "molstar/lib/mol-plugin-state/objects";
import { StateTransforms } from "molstar/lib/mol-plugin-state/transforms";
import { createVolumeRepresentationParams } from "molstar/lib/mol-plugin-state/helpers/volume-representation-params";

const MySpec: PluginSpec = {
  ...DefaultPluginSpec(),
  config: [[PluginConfig.VolumeStreaming.Enabled, false]],
};

function App() {
  const viewerDiv = createRef<HTMLDivElement>();
  const canvas3d = createRef<HTMLCanvasElement>();
  const [rawData, setRawData] = useState<ArrayBuffer>();

  useEffect(() => {
    fetch("test.mrc").then(async (response) => setRawData(await response.arrayBuffer()));
  }, []);

  useEffect(() => {
    async function init() {
      const plugin = new PluginContext(MySpec);
      await plugin.init();

      if (!plugin.initViewer(canvas3d.current as HTMLCanvasElement, viewerDiv.current as HTMLDivElement)) {
        console.error("Failed to init Mol*");
        return;
      }

      if (!rawData) {
        return;
      }

      const data = await plugin.builders.data.rawData({ data: rawData });
      const parsed = await plugin.dataFormats.get("ccp4")!.parse(plugin, data, {});
      const volume: StateObjectSelector<PluginStateObject.Volume.Data> = parsed.volumes?.[0] ?? parsed.volume;

      const repr = plugin.build();

      repr
        .to(volume)
        .apply(
          StateTransforms.Representation.VolumeRepresentation3D,
          createVolumeRepresentationParams(plugin, volume.data!)
        );
      repr.commit();
    }
    init();
  }, [viewerDiv, canvas3d, rawData]);

  return (
    <div ref={viewerDiv}>
      <canvas ref={canvas3d} />
    </div>
  );
}

export default App;
