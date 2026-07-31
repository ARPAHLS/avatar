import { defaultAvatar, defaultCamera, defaultLight } from '../../config/defaults';
import { AccordionSection, Divider, SliderRow } from '../ui/PanelPrimitives';

export function CameraPanel({
  openAccordion,
  setOpenAccordion,
  camera,
  setCamera,
  light,
  setLight,
  avatar,
  setAvatar,
}) {
  return (
    <>
      <AccordionSection
        open={openAccordion === 'camera'}
        onClick={() => setOpenAccordion(openAccordion === 'camera' ? null : 'camera')}
        label="Camera"
      >
        <SliderRow
          label="X"
          min={-2}
          max={2}
          step={0.01}
          value={camera.position[0]}
          onChange={(value) => setCamera((current) => ({ ...current, position: [value, current.position[1], current.position[2]] }))}
          onDoubleClick={() =>
            setCamera((current) => ({
              ...current,
              position: [defaultCamera.position[0], current.position[1], current.position[2]],
            }))
          }
        />
        <SliderRow
          label="Y"
          min={0.5}
          max={2.5}
          step={0.01}
          value={camera.position[1]}
          onChange={(value) => setCamera((current) => ({ ...current, position: [current.position[0], value, current.position[2]] }))}
          onDoubleClick={() =>
            setCamera((current) => ({
              ...current,
              position: [current.position[0], defaultCamera.position[1], current.position[2]],
            }))
          }
        />
        <SliderRow
          label="Z"
          min={0.5}
          max={3}
          step={0.01}
          value={camera.position[2]}
          onChange={(value) => setCamera((current) => ({ ...current, position: [current.position[0], current.position[1], value] }))}
          onDoubleClick={() =>
            setCamera((current) => ({
              ...current,
              position: [current.position[0], current.position[1], defaultCamera.position[2]],
            }))
          }
        />
        <SliderRow
          label="Look Y"
          min={0.5}
          max={2.5}
          step={0.01}
          value={camera.lookAt[1]}
          onChange={(value) => setCamera((current) => ({ ...current, lookAt: [current.lookAt[0], value, current.lookAt[2]] }))}
          onDoubleClick={() =>
            setCamera((current) => ({
              ...current,
              lookAt: [current.lookAt[0], defaultCamera.lookAt[1], current.lookAt[2]],
            }))
          }
        />
        <SliderRow
          label="FOV"
          min={10}
          max={60}
          step={0.1}
          value={camera.fov}
          onChange={(value) => setCamera((current) => ({ ...current, fov: value }))}
          onDoubleClick={() => setCamera((current) => ({ ...current, fov: defaultCamera.fov }))}
        />
        <div className="panel-actions">
          <button type="button" className="panel-button" onClick={() => setCamera({ ...defaultCamera })}>
            Reset Camera
          </button>
        </div>
      </AccordionSection>

      <Divider />

      <AccordionSection
        open={openAccordion === 'lighting'}
        onClick={() => setOpenAccordion(openAccordion === 'lighting' ? null : 'lighting')}
        label="Lighting"
      >
        <SliderRow
          label="Intensity"
          min={0}
          max={2}
          step={0.01}
          value={light.intensity}
          onChange={(value) => setLight((current) => ({ ...current, intensity: value }))}
          onDoubleClick={() => setLight((current) => ({ ...current, intensity: defaultLight.intensity }))}
        />
        <SliderRow
          label="X"
          min={-4}
          max={4}
          step={0.01}
          value={light.position[0]}
          onChange={(value) => setLight((current) => ({ ...current, position: [value, current.position[1], current.position[2]] }))}
          onDoubleClick={() =>
            setLight((current) => ({
              ...current,
              position: [defaultLight.position[0], current.position[1], current.position[2]],
            }))
          }
        />
        <SliderRow
          label="Y"
          min={-2}
          max={4}
          step={0.01}
          value={light.position[1]}
          onChange={(value) => setLight((current) => ({ ...current, position: [current.position[0], value, current.position[2]] }))}
          onDoubleClick={() =>
            setLight((current) => ({
              ...current,
              position: [current.position[0], defaultLight.position[1], current.position[2]],
            }))
          }
        />
        <SliderRow
          label="Z"
          min={-4}
          max={6}
          step={0.01}
          value={light.position[2]}
          onChange={(value) => setLight((current) => ({ ...current, position: [current.position[0], current.position[1], value] }))}
          onDoubleClick={() =>
            setLight((current) => ({
              ...current,
              position: [current.position[0], current.position[1], defaultLight.position[2]],
            }))
          }
        />
        <div className="color-row">
          <span>Color</span>
          <input
            type="color"
            value={light.color}
            onChange={(event) => setLight((current) => ({ ...current, color: event.target.value }))}
          />
          <span>{light.color}</span>
        </div>
        <div className="panel-actions">
          <button type="button" className="panel-button" onClick={() => setLight({ ...defaultLight })}>
            Reset Light
          </button>
        </div>
      </AccordionSection>

      <Divider />

      <AccordionSection
        open={openAccordion === 'avatar'}
        onClick={() => setOpenAccordion(openAccordion === 'avatar' ? null : 'avatar')}
        label="Avatar"
      >
        <SliderRow
          label="X"
          min={-2}
          max={2}
          step={0.01}
          value={avatar.position[0]}
          onChange={(value) => setAvatar((current) => ({ ...current, position: [value, current.position[1], current.position[2]] }))}
          onDoubleClick={() =>
            setAvatar((current) => ({
              ...current,
              position: [defaultAvatar.position[0], current.position[1], current.position[2]],
            }))
          }
        />
        <SliderRow
          label="Y"
          min={-2}
          max={2}
          step={0.01}
          value={avatar.position[1]}
          onChange={(value) => setAvatar((current) => ({ ...current, position: [current.position[0], value, current.position[2]] }))}
          onDoubleClick={() =>
            setAvatar((current) => ({
              ...current,
              position: [current.position[0], defaultAvatar.position[1], current.position[2]],
            }))
          }
        />
        <SliderRow
          label="Z"
          min={-2}
          max={2}
          step={0.01}
          value={avatar.position[2]}
          onChange={(value) => setAvatar((current) => ({ ...current, position: [current.position[0], current.position[1], value] }))}
          onDoubleClick={() =>
            setAvatar((current) => ({
              ...current,
              position: [current.position[0], current.position[1], defaultAvatar.position[2]],
            }))
          }
        />
        <div className="panel-actions">
          <button type="button" className="panel-button" onClick={() => setAvatar({ ...defaultAvatar })}>
            Reset Avatar
          </button>
        </div>
      </AccordionSection>
    </>
  );
}
